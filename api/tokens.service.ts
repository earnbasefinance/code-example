import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import {
    EarnBaseTokenAddress,
    GET_ENB_PRICE,
    UNISWAP_V2_API,
} from "@earnbase/constans";
import {
    EthereumPrice,
    Token,
    TokenPrice,
    TokenValue,
} from "@earnbase/shared-types";
import { uniqueMerge } from "@earnbase/utils";
import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, Interval } from "@nestjs/schedule";
import { find, pick } from "lodash";
import fetch from "node-fetch";

import { AlchemyService } from "../alchemy/alchemy.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TokensService implements OnModuleInit {
    private logger: Logger = new Logger("TokensService");
    private tokens: Token[] = [];
    private coingeckoTokens: Token[] = [];
    private tokensWithPrice: TokenValue = {};
    private ethereumPrice?: EthereumPrice;
    private client;

    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
        private alchemyService: AlchemyService,
    ) {
        this.client = new ApolloClient({
            uri: UNISWAP_V2_API,
            link: new HttpLink({ uri: UNISWAP_V2_API, fetch }),
            cache: new InMemoryCache(),
        });
    }

    getTokenPrice(address: string): TokenPrice | undefined {
        const token = this.tokens.find(
            (t) => t.address.toLowerCase() === address.toLowerCase(),
        );
        return token
            ? {
                  ...token,
                  price: {
                      usd:
                          this.tokensWithPrice[address.toLowerCase()]?.usd || 0,
                  },
              }
            : undefined;
    }

    onModuleInit() {
        this.setTokensList();
        this.setTokensPrices();
        this.setEthereumPrice();
    }

    fetchTokens() {
        return this.httpService.get(
            "https://tokens.coingecko.com/uniswap/all.json",
        );
    }

    @Cron("0 8 * * *")
    setTokensList() {
        try {
            this.fetchTokens().subscribe({
                next: (sub) => {
                    const tokens = sub?.data?.tokens;
                    if (tokens) {
                        this.coingeckoTokens = [
                            {
                                address: EarnBaseTokenAddress.toLowerCase(),
                                decimals: 18,
                                name: "Earnbase",
                                symbol: "ENB",
                            },
                            ...tokens.map((token) =>
                                pick(token, [
                                    "address",
                                    "decimals",
                                    "name",
                                    "symbol",
                                ]),
                            ),
                        ];
                    }
                },
                error: (error) => {
                    this.logger.error(`Tokens List: ${error}`);
                },
                complete: () => this.logger.log("Tokens list request complete"),
            });
        } catch (error) {
            this.logger.error(error);
        }
    }

    fetchTokensPrices() {
        return this.httpService.get(
            "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
            {
                headers: {
                    "X-CMC_PRO_API_KEY": this.configService.get(
                        "COINMARKETCAP_API_KEY",
                    ),
                },
                params: {
                    start: 1,
                    limit: 5000,
                    convert: "USD",
                    cryptocurrency_type: "tokens",
                },
            },
        );
    }

    fetchEthereumPrice() {
        return this.httpService.get(
            "https://api.coingecko.com/api/v3/simple/price",
            {
                params: {
                    ids: "ethereum",
                    include_24hr_change: true,
                    vs_currencies: "usd",
                },
            },
        );
    }

    async parseTokensPrices(tokens) {
        const resp: any = await this.client.query({
            query: GET_ENB_PRICE,
        });
        const enbETH = resp?.data?.token?.derivedETH;
        const enb = {
            "platform.token_address": EarnBaseTokenAddress.toLowerCase(),
            usd: enbETH * (this.ethereumPrice?.usd || 0) || 0,
        };

        const ethTokens = [
            ...tokens.filter((token) => token.platform?.id === 1027),
            enb,
        ];

        this.tokens = uniqueMerge(
            [
                {
                    address: EarnBaseTokenAddress.toLowerCase(),
                    decimals: 18,
                    name: "Earnbase",
                    symbol: "ENB",
                },
            ],
            this.coingeckoTokens.filter((token) =>
                find(ethTokens, ["platform.token_address", token.address]),
            ),
            (a, b) => a.address.toLowerCase() === b.address.toLowerCase(),
        );
        this.tokensWithPrice = this.tokens.reduce((accumulator, token) => {
            const tokenPrice = find(ethTokens, [
                "platform.token_address",
                token.address,
            ]);
            return tokenPrice
                ? {
                      ...accumulator,
                      [token.address.toLowerCase()]: {
                          usd: tokenPrice?.quote?.USD?.price || tokenPrice.usd,
                          percentChange1h:
                              tokenPrice?.quote?.USD?.percent_change_1h || 0,
                          percentChange24h:
                              tokenPrice?.quote?.USD?.percent_change_24h || 0,
                          percentChange7d:
                              tokenPrice?.quote?.USD?.percent_change_7d,
                      },
                  }
                : accumulator;
        }, {});
    }

    @Interval(30_000)
    setEthereumPrice() {
        try {
            this.fetchEthereumPrice().subscribe({
                next: (sub) => {
                    const price = sub?.data?.ethereum;
                    if (price) {
                        this.ethereumPrice = {
                            usd: price.usd,
                            percentChange24h: price.usd_24h_change,
                        };
                    }
                },
                error: (error) => {
                    this.logger.error(`ETH Price: ${error}`);
                },
                complete: () => this.logger.log("ETH Price request complete"),
            });
        } catch (error) {
            this.logger.error(error);
        }
    }

    @Interval(30_000)
    setTokensPrices() {
        try {
            this.fetchTokensPrices().subscribe({
                next: async (sub) => {
                    const tokens = sub?.data?.data;
                    if (tokens) {
                        await this.parseTokensPrices(tokens);
                    }
                },
                error: (error) => {
                    this.logger.error(`Tokens Price: ${error}`);
                },
                complete: () =>
                    this.logger.log("Tokens Price request complete"),
            });
        } catch (error) {
            this.logger.error(error);
        }
    }

    getTokensBalances(address: string) {
        try {
            this.alchemyService.fetchBalances(
                this.tokens,
                address,
                this.ethereumPrice,
                this.tokensWithPrice,
            );
        } catch (error) {
            this.logger.error(error);
        }
    }
}
