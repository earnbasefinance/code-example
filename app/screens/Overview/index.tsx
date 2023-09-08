import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import SummaryBox from "../../components/molecules/SummaryBox";
import Layout from "../../components/organism/Layout";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import Deposit from "../Overview/components/Deposit";
import useOverviewData from "../Overview/hooks/useOverviewData";

import AssetAllocation from "./components/AssetAllocation";
import BuyCrypto from "./components/BuyCrypto";
import EquityCurve from "./components/EquityCurve";
import Performance from "./components/Performance";
import SummaryTotal from "./components/SummaryTotal";
import WalletSummary from "./components/WalletSummary";
import s from "./style.module.scss";

const Overview: React.FC = () => {
    const {
        depositDebt,
        summaryBox,
        wallet,
        assetAllocation,
        totalWallet,
        total,
        performance,
        changeAmount,
        claimableRewards,
    } = useOverviewData();
    const { t } = useTranslation("overview");
    const isMobile = useBreakpoint("sm");

    const getDepositWidgets = useCallback(
        () =>
            depositDebt
                .filter((properties: any) => properties.value)
                .map((properties: any, index) => (
                    <Deposit key={index} {...properties} />
                )),
        [depositDebt],
    );

    const renderSummaryBoxs = useCallback(
        () =>
            summaryBox.map((data: any, index: number) => (
                <SummaryBox key={index} {...data} />
            )),
        [summaryBox],
    );

    return (
        <Layout title={t("title")} sideMenu>
            <div className={s.summary}>
                <SummaryTotal
                    total={total}
                    changePercent={performance["1w"]}
                    changeAmount={changeAmount}
                    debt={0}
                />

                {isMobile && (
                    <EquityCurve
                        crypto={"ETH"}
                        currency={"USD"}
                        claimableRewards={claimableRewards}
                    />
                )}

                <Performance performance={performance} />
                <BuyCrypto />
            </div>
            <div className={s.charts}>{renderSummaryBoxs()}</div>
            <div className={s.bank}>
                <WalletSummary wallet={wallet} total={totalWallet} />
                {!isMobile && (
                    <EquityCurve
                        crypto={"ETH"}
                        currency={"USD"}
                        claimableRewards={claimableRewards}
                    />
                )}
            </div>
            <div className={s.deposit}>
                <AssetAllocation assetAllocation={assetAllocation} />
                {getDepositWidgets()}
            </div>
        </Layout>
    );
};

export default Overview;
