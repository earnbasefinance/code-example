import {
    Box,
    Button,
    Center,
    Grid,
    GridItem,
    Heading,
    HStack,
    Text,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ReactComponent as Dots } from "../../assets/svg/dots.svg";
import GraphBgMobile from "../../assets/svg/lander-graph-mobile.svg";
import GraphBg from "../../assets/svg/lander-graph.svg";
import { ReactComponent as LanderOverviewMobileSvg } from "../../assets/svg/lander-overview-mobile.svg";
import { ReactComponent as LanderOverviewSvg } from "../../assets/svg/lander-overview.svg";
import { ReactComponent as SendIcon } from "../../assets/svg/send.svg";
import { Alert } from "../../components/atoms/Alert";
import BorderedBox from "../../components/atoms/BorderedBox";
import { Copyright } from "../../components/atoms/Copyright";
import { SearchInput } from "../../components/atoms/SearchInput";
import { FontFamily, FontWeight } from "../../components/atoms/Text";
import InterText from "../../components/atoms/Text/InterText";
import Socials from "../../components/molecules/Socials";
import Layout from "../../components/organism/Layout";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useErrorTranslation } from "../../hooks/useErrorTranslation";
import { useFormatRoute } from "../../hooks/useFormatRoute";
import { Routes } from "../../interfaces/routes";
import { useWallet } from "../../store/useWallet";

import { HomepageButtons } from "./HomepageButtons";

type RegisterFormType = {
    address: string;
};

const Homepage: React.FC = () => {
    const { t } = useTranslation("homepage");
    const errorT = useErrorTranslation();
    const formatRoute = useFormatRoute();

    const isMobile = useBreakpoint("sm");
    const { setWallet } = useWallet();
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormType>({
        mode: "onSubmit",
    });

    const handleWallet = useCallback((address: string) => {
        setWallet({ address: address.toLowerCase() });
        navigate(formatRoute(Routes.Overview, { walletAddress: address }), {
            replace: true,
        });
    }, []);

    const onSubmit = useCallback(
        (data) => {
            handleWallet(data.address);
        },
        [handleWallet],
    );

    const validateAddress = useCallback((address: string) => {
        try {
            ethers.utils.getAddress(address);
            return true;
        } catch {
            return false;
        }
    }, []);

    return (
        <Layout
            loggedIn={false}
            variant="secondary"
            limitWidth={false}
            backgroundImage={`url('${isMobile ? GraphBgMobile : GraphBg}')`}
            backgroundRepeat="no-repeat"
            backgroundPosition={["top 50px right", "bottom right"]}
        >
            <Grid
                flexGrow={1}
                templateColumns="405px minmax(0, 850px)"
                templateRows="auto minmax(100px, 1fr)"
                display={["block", "grid"]}
                gap={"4%"}
                px={[null, "0", "52px"]}
                zIndex="2"
                justifyContent="center"
            >
                <GridItem pt={["1em", "5em"]}>
                    <Heading
                        as="h1"
                        fontSize={["32px", "40px"]}
                        fontFamily={FontFamily.Inter}
                        mb="26px"
                    >
                        {t("heading")}
                    </Heading>

                    <Text maxWidth="356px" color="lightGrey">
                        {t("description")}
                    </Text>

                    <HomepageButtons handleWallet={handleWallet} />

                    <BorderedBox paddding="20px" display="block" mb="15px">
                        <InterText fontWeight={FontWeight.w500}>
                            {t("trackAddress", { name: "Ethereum" })}
                        </InterText>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <HStack spacing="0.5em" mt="1em">
                                <SearchInput
                                    placeholder={t("addressInput.placeholder")}
                                    name="address"
                                    register={(_, options) =>
                                        register("address", {
                                            ...options,
                                            validate: validateAddress,
                                        })
                                    }
                                    isInvalid={Boolean(errors?.address)}
                                    ml="0"
                                />

                                <Button
                                    variant="bordered"
                                    width="72px"
                                    padding="0"
                                    type="submit"
                                >
                                    <SendIcon />
                                </Button>
                            </HStack>
                        </form>
                    </BorderedBox>

                    {Boolean(errors?.address) && (
                        <Alert status="error" mb="15px">
                            {errorT("invalidAddress", { name: "ETH" })}{" "}
                            {errorT("tryAgain")}
                        </Alert>
                    )}
                </GridItem>

                {isMobile ? (
                    <Center flexDirection="column">
                        {/* <Image
                                src={LanderOverviewMobile}
                                borderRadius="31px"
                                border="10px solid"
                                borderColor="accent"
                                boxShadow="0px 40px 82px 20px rgba(13, 11, 23, 0.5)"
                                maxWidth="293px"
                            /> */}
                        <Box
                            boxShadow="0px 40px 82px 20px rgba(13, 11, 23, 0.5)"
                            width="100%"
                        >
                            <LanderOverviewMobileSvg />
                        </Box>

                        <HomepageButtons handleWallet={handleWallet} />
                    </Center>
                ) : (
                    <>
                        <GridItem position="relative">
                            <Box position="absolute">
                                <Dots />
                            </Box>
                            {/*
                            <Image
                                src={LanderOverview}
                                borderRadius="50px"
                                border="15px solid"
                                borderColor="accent"
                                boxShadow="80px 60px 60px rgba(0, 0, 0, 0.4), inset -30px -2px 30px rgba(255, 255, 255, 0.03), inset 30px 2px 30px rgba(9, 9, 9, 0.1)"
                                transform="translate(60px, 40px)"
                                minWidth="820px"
                            /> */}
                            <Box
                                transform="translate(48px, 51px)"
                                minWidth="940px"
                                mb="40px"
                            >
                                <LanderOverviewSvg />
                            </Box>
                        </GridItem>
                        <GridItem alignSelf="end">
                            <Socials />
                        </GridItem>
                        <GridItem alignSelf="end">
                            <Copyright align="right" />
                        </GridItem>
                    </>
                )}
            </Grid>
        </Layout>
    );
};

export default Homepage;
