import {LiquidityPool} from "@earnbase/shared-types";
import {useMemo} from "react";

import {useEthPrice} from "../../contexts/GlobalData";
import {useUserPositions} from "../../contexts/User";
import {MyPoolType, TokenFees} from "../../interfaces/pool";
import {useWallet} from "../../store/useWallet";
import {percentageDifference} from "../../utils/math";

/**
 * @param pool
 */
export default function useMyLiquidityPairData(pool: LiquidityPool) {
    const { walletAddress } = useWallet();

    const positions = useUserPositions(walletAddress);
    const position = useMemo(
        () => positions?.find((pos) => pos?.pair?.id === pool.id),
        [pool, positions],
    );

    const [ethPrice] = useEthPrice();
    const token0Fees = useMemo(
        () => ({
            name: position?.pair.token0.symbol.replace("WETH", "ETH"),
            value: position
                ? Number.parseFloat(position.pair.token0.derivedETH)
                    ? position.fees.sum /
                      (Number.parseFloat(position.pair.token0.derivedETH) *
                          ethPrice) /
                      2
                    : 0
                : 0,
        }),

        [position, ethPrice],
    );

    const token1Fees: TokenFees = useMemo(
        () => ({
            name: position?.pair.token1.symbol.replace("WETH", "ETH"),
            value: position
                ? Number.parseFloat(position.pair.token1.derivedETH)
                    ? position.fees.sum /
                      (Number.parseFloat(position.pair.token1.derivedETH) *
                          ethPrice) /
                      2
                    : 0
                : 0,
        }),

        [position, ethPrice],
    );

    const added = useMemo(() => {
        if (position) {
            return {
                total: position.principal.usd,
                token1: position.principal.amount1,
                token0: position.principal.amount0,
            };
        }
        return { total: 0, token1: 0, token0: 0 };
    }, [position]);

    const current = useMemo(() => {
        if (position) {
            const poolOwnership =
                position.pair.totalSupply !== 0
                    ? position.lastSnapshot.liquidityTokenBalance /
                      position.pair.totalSupply
                    : 0;
            const valueUSD = poolOwnership * position.pair.reserveUSD;

            return {
                token0:
                    poolOwnership * Number.parseFloat(position.pair.reserve0),
                token1:
                    poolOwnership * Number.parseFloat(position.pair.reserve1),
                total: valueUSD,
            };
        } else {
            return {
                token0: 0,
                token1: 0,
                total: 0,
            };
        }
    }, [position]);

    const totalFees = useMemo(
        () => (position ? position?.fees?.sum : 0),
        [position],
    );

    const totalReturn = useMemo(() => {
        if (position) {
            const value = position.impLoss as number;
            const change = percentageDifference(
                value + position.principal.usd,
                position.principal.usd,
            );

            return {
                value,
                change,
            };
        } else {
            return {
                value: 0,
                change: 0,
            };
        }
    }, [position]);

    const myPool: MyPoolType = useMemo(() => {
        return {
            market: pool?.provider ? pool.provider : "",
            token0Symbol: pool.token0 ? pool.token0.symbol : "",
            token1Symbol: pool.token1 ? pool.token1.symbol : "",
            current,
            added,
            totalFees,
            token0Fees,
            token1Fees,
            totalReturn: totalReturn.value,
            totalReturnChange: totalReturn.change,
        };
    }, [pool, added, totalFees, token0Fees, token1Fees, totalReturn, current]);
    return {
        myPool,
        loading: false,
    };
}
