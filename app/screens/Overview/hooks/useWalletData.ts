import { useMemo } from "react";

import useTokensBalance from "../../../hooks/useTokensBalance";

export default function useWalletData() {
    const wallet = useTokensBalance();
    const total: number | undefined = useMemo(
        () =>
            wallet
                ? wallet.reduce(
                      (accumulator: number, { fiatBalance }) =>
                          accumulator + fiatBalance.usd,
                      0,
                  )
                : undefined,
        [wallet],
    );

    return useMemo(() => total, [total]);
}
