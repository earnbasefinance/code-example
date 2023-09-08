import { useEffect, useMemo, useState } from "react";

import useIsMounted from "../../../hooks/useIsMounted";
import { useWallet } from "../../../store/useWallet";
import { percentageDifference } from "../../../utils/math";
import { getCharts } from "../../../services/zerion/ZerionProvider";

export type PerformanceType = {
    "1w"?: number;
    "1m"?: number;
    "3m"?: number;
    "1y"?: number;
};

export default function usePerformanceData() {
    const { walletAddress } = useWallet();
    const [performance, setPerformance] = useState<PerformanceType>({
        "1w": undefined,
        "1m": undefined,
        "3m": undefined,
        "1y": undefined,
    });

    const [changeAmount, setChangeAmount] = useState<number | undefined>(
        undefined,
    );

    const { isMountedRef } = useIsMounted();

    useEffect(() => {
        if (walletAddress) {
            getCharts(walletAddress).then((response: any) => {
                const data =
                    response?.payload?.charts?.others?.map(
                        ([, value]: number[]) => {
                            return value;
                        },
                    ) || [];
                if (data.length >= 365) {
                    const todayValue = data[0];
                    const weekAgo = data[6];
                    const monthAgoValue = data[29];
                    const threeMonthsAgoValue = data[89];
                    const yerAgoValue = data[data.length - 1];

                    if (isMountedRef.current) {
                        setPerformance({
                            "1w": percentageDifference(todayValue, weekAgo),
                            "1m": percentageDifference(
                                todayValue,
                                monthAgoValue,
                            ),
                            "3m": percentageDifference(
                                todayValue,
                                threeMonthsAgoValue,
                            ),
                            "1y": percentageDifference(todayValue, yerAgoValue),
                        });
                        setChangeAmount(todayValue - weekAgo);
                    }
                }
            });
        }
    }, [walletAddress]);

    return useMemo(
        () => ({ performance, changeAmount }),
        [performance, changeAmount],
    );
}
