import { Box } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { StakeDesciption } from "../../components/atoms/StakeDescription";
import Layout from "../../components/organism/Layout";
import { useStakePool } from "../../hooks/useStakePools";
import { useUserStakePool } from "../../hooks/useUserStakePools";

import { ResponsivePools } from "./components/ResponsivePools";
import StakingSummary from "./components/StakingSummary";
import useStakeTokenTableData from "./hooks/useStakeTokenTableData";

const StakePool: React.FC = () => {
    const { t } = useTranslation("stake");

    const { address } = useParams<{ address: string }>();

    const stakePool = useStakePool(address!);
    const userStakePool = useUserStakePool(address!);
    const tableData = useStakeTokenTableData(stakePool, userStakePool);
    const title = useMemo(() => {
        return t("titleWithToken", { token: stakePool?.token.symbol });
    }, [t, stakePool]);

    return (
        <Layout title={title} sideMenu>
            <StakeDesciption token={stakePool?.token} />
            <Box mt={["33px", "70px"]} mb="70px">
                <ResponsivePools stakesTableData={tableData} />
            </Box>
            <StakingSummary
                stakePool={stakePool}
                userStakePool={userStakePool}
            />
        </Layout>
    );
};

export default StakePool;
