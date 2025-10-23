<script lang="ts">
    import { goto } from "$app/navigation";
    import { alerts } from "$lib/stores/alert";
    import { onMount } from "svelte";
    import {
        INVESTMENT_PLANS,
        formatCurrency,
        formatDate,
        calculateCurrentProfit,
    } from "$lib/utils/investment";
    import { userService } from "$lib/services/userService";
    import { auth } from "$lib/stores/auth";

    let userInfo: any = null;
    let investmentPlans: any[] = [];
    let selectedPlan: any = null;
    let savingsAmount: number = 0;
    let autoResubmit: boolean = false;
    let isLoading: boolean = false;
    let investments: any[] = [];
    let summary = {
        totalInvested: 0,
        totalProfit: 0,
        totalEstimatedIncome: 0,
    };

    onMount(async () => {
        await loadInvestmentPlans();
        await loadAllData();
    });

    async function loadInvestmentPlans() {
        try {
            const response = await fetch("/api/investment/plans");
            const result = await response.json();
            if (result.success) {
                investmentPlans = result.data;
                selectedPlan = investmentPlans[0]; // Select first plan by default
            }
        } catch (error) {
            console.error("Load investment plans error:", error);
        }
    }

    async function loadAllData() {
        isLoading = true;
        try {
            const [userInfoData, investmentData] = await Promise.all([
                userService.getUserInfo(),
                userService.getInvestmentHistory(),
            ]);

            if (userInfoData) {
                userInfo = userInfoData;
            }

            if (investmentData) {
                investments = investmentData.investments;
                summary = {
                    totalInvested: investmentData.summary.totalInvested,
                    totalProfit: investmentData.summary.totalProfit,
                    totalEstimatedIncome:
                        investmentData.summary.totalEstimatedIncome,
                };
            }
        } catch (error) {
            console.error("Load all data error:", error);
        } finally {
            isLoading = false;
        }
    }

    async function handleInvest() {
        if (!savingsAmount || !selectedPlan) {
            alerts.error("กรุณาเลือกแผนการลงทุนและกรอกจำนวนเงิน");
            return;
        }

        if (savingsAmount < selectedPlan.minAmount) {
            alerts.error(
                `จำนวนเงินลงทุนขั้นต่ำคือ ${formatCurrency(selectedPlan.minAmount)}`,
            );
            return;
        }

        if (savingsAmount > selectedPlan.maxAmount) {
            alerts.error(
                `จำนวนเงินลงทุนสูงสุดคือ ${formatCurrency(selectedPlan.maxAmount)}`,
            );
            return;
        }

        // Get current user from auth store
        let currentUser = null;
        auth.subscribe((state) => {
            currentUser = state.user;
        })();

        if (
            !currentUser ||
            savingsAmount > (currentUser as any).available_balance
        ) {
            alerts.error("ยอดเงินคงเหลือไม่เพียงพอ");
            return;
        }

        if (!selectedPlan) {
            alerts.error("กรุณาเลือกแผนการลงทุน");
            return;
        }

        isLoading = true;

        try {
            const token = userService.getToken();
            if (!token) {
                alerts.error("กรุณาเข้าสู่ระบบใหม่");
                return;
            }

            const response = await fetch("/api/investment/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount: savingsAmount,
                    duration: selectedPlan.duration,
                    autoResubmit: autoResubmit,
                }),
            });

            const result = await response.json();

            if (result.success) {
                alerts.success(result.message);
                // Reset form
                savingsAmount = 0;
                autoResubmit = false;
                // Reload data to get updated balance
                await loadAllData();
            } else {
                alerts.error(result.message);
            }
        } catch (error) {
            console.error("Invest error:", error);
            alerts.error("เกิดข้อผิดพลาดในการลงทุน กรุณาลองใหม่");
        } finally {
            isLoading = false;
        }
    }

    async function handleRefresh() {
        await loadAllData();
        alerts.success("รีเฟรชข้อมูลสำเร็จ");
    }

    async function toggleAutoResubmit(
        investmentId: string,
        currentStatus: boolean,
    ) {
        try {
            const token = userService.getToken();
            if (!token) {
                alerts.error("กรุณาเข้าสู่ระบบใหม่");
                return;
            }

            const response = await fetch("/api/investment/history", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    investmentId,
                    autoResubmit: !currentStatus,
                }),
            });

            const result = await response.json();

            if (result.success) {
                alerts.success(result.message);
                await loadAllData();
            } else {
                alerts.error(result.message);
            }
        } catch (error) {
            console.error("Toggle auto resubmit error:", error);
            alerts.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
        }
    }

    function selectPlan(plan: any) {
        selectedPlan = plan;
        // Reset savings amount when switching plans to avoid validation issues
        savingsAmount = 0;
    }

    function getProfitClass(amount: number): string {
        return amount >= 0 ? "text-emerald-600" : "text-red-600";
    }

    function getAmountClass(amount: number): string {
        return amount >= 0 ? "text-black" : "text-red-600";
    }
</script>

<main class="max-w-screen-sm h-dvh flex flex-col mx-auto text-lg text-black">
    <!-- Header -->
    <header class="flex items-center justify-between py-4 px-4">
        <h1 class="text-2xl font-semibold">BNP Fund</h1>
        <button
            class="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-neutral-300 hover:bg-neutral-50"
            on:click={handleRefresh}
        >
            <!-- icon -->
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
            >
                <path
                    d="M3 12a9 9 0 0 1 15.5-6.364M21 12a9 9 0 0 1-15.5 6.364"
                />
                <path d="M3 4v5h5M16 15h5v5" />
            </svg>
            <span class="text-base"
                >Refresh Page <span class="text-neutral-500">/ รีเฟรชหน้า</span
                ></span
            >
        </button>
    </header>

    <!-- Tabs -->
    <nav class="px-4">
        <div class="grid grid-cols-6 gap-2 rounded-2xl p-1 bg-neutral-100">
            {#each investmentPlans as plan}
                <button
                    class="rounded-xl px-2 py-2 text-center {selectedPlan?.duration ===
                    plan.duration
                        ? 'bg-white shadow'
                        : 'hover:bg-white/60'}"
                    on:click={() => selectPlan(plan)}
                >
                    <div class="text-sm font-semibold">{plan.label}</div>
                    <div class="text-xs text-neutral-500">
                        {plan.rewardPercentage}%
                    </div>
                    <div class="text-xs text-neutral-400">
                        {formatCurrency(plan.minAmount)}-{formatCurrency(
                            plan.maxAmount,
                        )}
                    </div>
                </button>
            {/each}
        </div>
    </nav>

    <!-- Summary Card -->
    <section class="px-4 mt-4">
        <div class="rounded-2xl border border-neutral-200 p-4 space-y-4">
            <dl class="grid grid-cols-2 gap-y-3">
                <dt class="text-neutral-500">
                    Available Balance <span class="text-xs"
                        >/ ยอดเงินพร้อมใช้</span
                    >
                </dt>
                <dd class="text-right text-black font-medium">
                    {formatCurrency((userInfo as any)?.available_balance || 0)}
                </dd>

                <dt class="text-neutral-500">
                    Amount Saved <span class="text-xs">/ ยอดที่ออมแล้ว</span>
                </dt>
                <dd class="text-right text-black font-medium">
                    {formatCurrency(summary.totalInvested)}
                </dd>

                <dt class="text-neutral-500">
                    Estimated Income <span class="text-xs"
                        >/ ประมาณการรายได้</span
                    >
                </dt>
                <dd class="text-right font-medium text-emerald-600">
                    {formatCurrency(summary.totalProfit)}
                </dd>

                <dt class="text-neutral-500">
                    Total Estimated Income <span class="text-xs"
                        >/ รวมประมาณการรายได้</span
                    >
                </dt>
                <dd class="text-right font-medium text-emerald-600">
                    {formatCurrency(summary.totalEstimatedIncome)}
                </dd>

                <dt class="text-neutral-500 flex items-center gap-2">
                    Auto Resubmit <span class="text-xs">/ ส่งคำขออัตโนมัติ</span
                    >
                </dt>
                <dd class="text-right">
                    <label class="inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            bind:checked={autoResubmit}
                            class="peer sr-only"
                        />
                        <span
                            class="w-11 h-6 bg-neutral-300 rounded-full peer-checked:bg-emerald-500 transition-colors relative"
                        >
                            <span
                                class="absolute left-0.5 top-0.5 size-5 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow"
                            ></span>
                        </span>
                    </label>
                </dd>

                <!-- Savings Balance as number input -->
                <dt class="text-neutral-500">
                    <label for="savings-input" class="cursor-pointer">
                        Savings Balance <span class="text-xs">/ ยอดเงินออม</span
                        >
                    </label>
                    <div class="text-xs text-neutral-400">
                        Enter amount to save / กรอกยอดเงินที่ต้องการออม
                        {#if selectedPlan}
                            <br />
                            Min: {formatCurrency(selectedPlan.minAmount)}, Max: {formatCurrency(
                                selectedPlan.maxAmount,
                            )}
                        {/if}
                    </div>
                </dt>
                <dd class="text-right">
                    <input
                        id="savings-input"
                        type="number"
                        inputmode="decimal"
                        min={selectedPlan?.minAmount || 1}
                        max={selectedPlan?.maxAmount || 1000000}
                        step="0.01"
                        placeholder={selectedPlan
                            ? `Min: ${formatCurrency(selectedPlan.minAmount)}`
                            : "0.00"}
                        bind:value={savingsAmount}
                        class="w-48 text-right border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {#if selectedPlan && savingsAmount > 0}
                        <div class="text-xs text-neutral-400 mt-1">
                            Limit: {formatCurrency(selectedPlan.minAmount)} - {formatCurrency(
                                selectedPlan.maxAmount,
                            )}
                        </div>
                    {/if}
                </dd>
            </dl>

            <button
                class="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                on:click={handleInvest}
                disabled={isLoading ||
                    !savingsAmount ||
                    !selectedPlan ||
                    savingsAmount < (selectedPlan?.minAmount || 1) ||
                    savingsAmount > (selectedPlan?.maxAmount || 1000000) ||
                    !userInfo ||
                    savingsAmount > ((userInfo as any)?.available_balance || 0)}
            >
                {#if isLoading}
                    <span class="mdi mdi-loading mdi-spin"></span>
                    กำลังลงทุน...
                {:else}
                    Invest in Project <span class="text-neutral-200"
                        >/ ลงทุนในโปรเจกต์</span
                    >
                {/if}
            </button>
        </div>
    </section>

    <!-- History -->
    <!-- <section class="px-4 mt-6 pb-6 overflow-y-auto">
        <h2 class="text-xl font-semibold mb-3">
            Investment History and Profits <span
                class="text-neutral-500 text-base"
                >/ ประวัติการลงทุนและกำไร</span
            >
        </h2>

        {#if investments.length === 0}
            <div class="text-center py-8 text-neutral-500">
                <div class="mdi mdi-inbox text-4xl mb-2"></div>
                <p>ไม่มีประวัติการลงทุน</p>
            </div>
        {:else if isLoading}
            <div class="text-center py-8 text-neutral-500">
                <div class="mdi mdi-loading mdi-spin text-4xl mb-2"></div>
                <p>กำลังโหลดข้อมูล...</p>
            </div>
        {:else}
            {#each investments as investment}
                <article class="rounded-2xl border border-neutral-200 p-4 mb-3">
                    <div class="grid grid-cols-2 gap-y-2 text-base">
                        <div class="text-neutral-500">
                            Investment Amount <span class="text-xs"
                                >/ จำนวนเงินลงทุน</span
                            >
                        </div>
                        <div
                            class="text-right font-medium {getAmountClass(
                                investment.amount,
                            )}"
                        >
                            {formatCurrency(investment.amount)}
                        </div>

                        <div class="text-neutral-500">
                            Date <span class="text-xs">/ วันที่</span>
                        </div>
                        <div class="text-right">
                            {formatDate(investment.startDate)}
                        </div>

                        <div class="text-neutral-500">
                            Status <span class="text-xs">/ สถานะ</span>
                        </div>
                        <div class="text-right capitalize">
                            {investment.status}
                        </div>

                        <div class="text-neutral-500">
                            Reward Percentage <span class="text-xs"
                                >/ เปอร์เซ็นต์รางวัล</span
                            >
                        </div>
                        <div class="text-right">
                            {investment.rewardPercentage}%
                        </div>

                        <div class="text-neutral-500">
                            Duration <span class="text-xs">/ ระยะเวลา</span>
                        </div>
                        <div class="text-right">{investment.duration} days</div>

                        <div class="text-neutral-500">
                            Profit <span class="text-xs">/ กำไร</span>
                        </div>
                        <div
                            class="text-right font-medium {getProfitClass(
                                investment.profit,
                            )}"
                        >
                            {formatCurrency(investment.profit)}
                        </div>
                    </div>
                    <div class="mt-3 flex items-center justify-between">
                        <span class="text-neutral-600">
                            Auto Resubmit <span class="text-xs"
                                >/ ส่งคำขออัตโนมัติ</span
                            >
                        </span>
                        <label class="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={investment.autoResubmit}
                                on:change={() =>
                                    toggleAutoResubmit(
                                        investment.id,
                                        investment.autoResubmit,
                                    )}
                                class="peer sr-only"
                            />
                            <span
                                class="w-11 h-6 bg-neutral-300 rounded-full peer-checked:bg-emerald-500 transition-colors relative"
                            >
                                <span
                                    class="absolute left-0.5 top-0.5 size-5 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow"
                                ></span>
                            </span>
                        </label>
                    </div>
                </article>
            {/each}
        {/if}
    </section> -->
</main>
