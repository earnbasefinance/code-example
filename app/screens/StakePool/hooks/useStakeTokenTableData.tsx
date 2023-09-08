import { StakePool, UserStakePool } from "@earnbase/shared-types";
import { formatUnits } from "ethers/lib/utils";
import _ from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import TokenIcon from "../../../components/atoms/TokenIcon";
import StakeTokenModal from "../../../components/molecules/StakeTokenModal";
import { DisplayWrapper } from "../../../components/molecules/Table/useSortedTable";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import useTokensBalance from "../../../hooks/useTokensBalance";
import { formatCrypto } from "../../../utils/formatCrypto";
import { formatPercent } from "../../../utils/formatPercent";
import { formatNumberString } from "../../../utils/utils";

export type StakeTokenTableDataKey =
    | "token"
    | "available"
    | "staking"
    | "apr"
    | "action";

/**
 * @param stakePool
 * @param userStakePool
 */
export default function useStakeTokenTableData(
    stakePool?: StakePool,
    userStakePool?: UserStakePool,
) {
    const { t } = useTranslation("stake");
    const isTablet = useBreakpoint("lg");

    const header = useMemo(
        (): any => ({
            token: { label: t("table.token"), sortable: false },
            available: { label: t("table.available"), sortable: false },
            staking: { label: t("table.staking"), sortable: false },
            apr: { label: t("table.estimatedAPR"), sortable: false },
            ...(!isTablet && { action: { label: "", sortable: false } }),
        }),
        [isTablet, t],
    );
    const tokensBalance = useTokensBalance();

    const data = useMemo((): any => {
        if (!stakePool) return [];
        const walletToken = _.find(tokensBalance, [
            "address",
            stakePool.token.address.toLowerCase(),
        ]);
        const available = walletToken
            ? Number.parseFloat(
                  formatUnits(walletToken.balance, walletToken.decimals),
              )
            : 0;
        const availablePrice = walletToken ? walletToken.fiatBalance.usd : 0;
        // const fiatRewards = userStakePool
        //     ? userStakePool.fiatLifetimeRewards.usd +
        //       userStakePool.fiatClaimableRewards.usd
        //     : 0;
        // const rewards = userStakePool
        //     ? userStakePool.lifetimeRewards + userStakePool.claimableRewards
        //     : 0;

        const staking = userStakePool ? userStakePool.stakingBalance : 0;
        const fiatStaking = userStakePool
            ? userStakePool.fiatStakingBalance.usd
            : 0;
        return [
            {
                token: {
                    value: stakePool.token.name,
                    icon: (
                        <TokenIcon
                            address={stakePool.token.address}
                            name={stakePool.token.name}
                        />
                    ),
                    displayValues: [
                        { value: stakePool.token.name },
                        {
                            value: stakePool.token.symbol,
                            wrapper: DisplayWrapper.InfoText,
                        },
                    ],
                },
                available: {
                    value: availablePrice,
                    displayValues: [
                        {
                            value: formatNumberString(availablePrice, true),
                        },
                        {
                            value: formatCrypto(
                                available,
                                stakePool.token.symbol,
                            ),
                            wrapper: DisplayWrapper.InfoText,
                        },
                    ],
                },
                staking: {
                    value: staking,
                    displayValues: [
                        {
                            value: formatNumberString(fiatStaking, true),
                        },
                        {
                            value: formatCrypto(
                                staking,
                                stakePool.token.symbol,
                            ),
                            wrapper: DisplayWrapper.InfoText,
                        },
                    ],
                },
                apr: {
                    value: stakePool.aprYear,
                    displayValues: [
                        {
                            value: `${t("table.roiYear", {
                                percent: formatPercent(stakePool.aprYear),
                            })}`,
                            wrapper: DisplayWrapper.Numeric,
                        },
                        {
                            value: `${t("table.roiWeek", {
                                percent: formatPercent(stakePool.aprWeek),
                            })}`,
                            wrapper: DisplayWrapper.InfoText,
                        },
                    ],
                },
                ...(!isTablet && {
                    action: {
                        value: "",
                        horizontal: true,
                        displayValues: [
                            {
                                value: `${t("table.stake")}`,
                                wrapper: () => (
                                    <StakeTokenModal
                                        stakePool={stakePool}
                                        userStakePool={userStakePool}
                                        buttonsProps={{
                                            fontSize: "14px",
                                        }}
                                    />
                                ),
                            },
                        ],
                    },
                }),
            },
        ];
    }, [t, stakePool, isTablet, tokensBalance, userStakePool]);

    return {
        data,
        header,
    };
}
