<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { alerts } from "$lib/stores/alert";
    import { userService } from "$lib/services/userService";
    import { auth } from "$lib/stores/auth";
    import { formatCurrency, formatDate } from "$lib/utils/investment";
    import type {
        Investment,
        InvestmentSummary,
    } from "$lib/services/userService";

    let user: any = null;
    let investments: Investment[] = [];
    let summary: InvestmentSummary | null = null;
    let isLoading = true;
    let selectedFilter = "all"; // all, active, completed
    let filteredInvestments: Investment[] = [];

    onMount(() => {
        // Subscribe to auth changes
        const unsubscribe = auth.subscribe((authState) => {
            user = authState.user;
        });

        // Initialize async operations
        const initAuth = async () => {
            await loadInvestmentData();
        };

        // Execute async operations
        initAuth();

        return () => {
            unsubscribe();
        };
    });

    async function loadInvestmentData() {
        isLoading = true;
        try {
            const investmentData = await userService.getInvestmentHistory();

            if (investmentData) {
                investments = investmentData.investments || [];
                summary = investmentData.summary;
                filterInvestments();
            }
        } catch (error) {
            console.error("Load investment data error:", error);
            alerts.error("เกิดข้อผิดพลาดในการโหลดข้อมูลการลงทุน");
        } finally {
            isLoading = false;
        }
    }

    function filterInvestments(): void {
        switch (selectedFilter) {
            case "active":
                filteredInvestments = investments.filter(
                    (inv: Investment) => inv.status === "active",
                );
                break;
            case "completed":
                filteredInvestments = investments.filter(
                    (inv: Investment) => inv.status === "completed",
                );
                break;
            case "cancelled":
                filteredInvestments = investments.filter(
                    (inv: Investment) => inv.status === "cancelled",
                );
                break;
            default:
                filteredInvestments = investments;
        }
    }

    function getStatusClass(status: Investment["status"]): string {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800";
            case "completed":
                return "bg-blue-100 text-blue-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    }

    function getStatusText(status: Investment["status"]): string {
        switch (status) {
            case "active":
                return "กำลังดำเนินการ";
            case "completed":
                return "เสร็จสิ้น";
            case "pending":
                return "รอดำเนินการ";
            case "cancelled":
                return "ยกเลิก";
            default:
                return status;
        }
    }

    function getProfitClass(profit: number) {
        return profit >= 0 ? "text-green-600" : "text-red-600";
    }

    async function handleRefresh() {
        await loadInvestmentData();
        alerts.success("รีเฟรชข้อมูลสำเร็จ");
    }

    $: (selectedFilter, filterInvestments());
</script>

<main class="max-w-screen-sm h-dvh flex flex-col mx-auto text-lg">
    <header class="relative bg-[#f59e0b] text-center py-5">
        <button
            class="text-5xl mdi mdi-chevron-left absolute left-0 top-1/2 -translate-y-1/2"
            on:click={() => goto("/my")}
            title="กลับ"
            aria-label="กลับ"
        ></button>
        <h1 class="text-2xl font-semibold">บันทึกการลงทุน</h1>
        <button
            class="text-3xl mdi mdi-refresh absolute right-4 top-1/2 -translate-y-1/2"
            on:click={handleRefresh}
            disabled={isLoading}
            title="รีเฟรช"
            aria-label="รีเฟรช"
        ></button>
    </header>

    {#if isLoading}
        <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
                <div
                    class="text-6xl mdi mdi-loading mdi-spin text-[#f59e0b] mb-4"
                ></div>
                <p class="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
        </div>
    {:else}
        <!-- Summary Section -->
        {#if summary}
            <section
                class="bg-linear-to-r from-blue-900 to-blue-800 text-white p-6 mx-4 mt-4 rounded-2xl"
            >
                <h2 class="text-xl font-bold mb-4">สรุปการลงทุน</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white/10 backdrop-blur rounded-xl p-3">
                        <div class="text-sm opacity-80">ยอดลงทุนรวม</div>
                        <div class="text-xl font-bold">
                            {formatCurrency(summary.totalInvested)}
                        </div>
                    </div>
                    <div class="bg-white/10 backdrop-blur rounded-xl p-3">
                        <div class="text-sm opacity-80">กำไรขาดทุน</div>
                        <div
                            class="text-xl font-bold {getProfitClass(
                                summary.profitLoss,
                            )}"
                        >
                            {formatCurrency(summary.profitLoss)}
                        </div>
                    </div>
                    <div class="bg-white/10 backdrop-blur rounded-xl p-3">
                        <div class="text-sm opacity-80">รายได้คาดการณ์</div>
                        <div class="text-xl font-bold">
                            {formatCurrency(summary.totalEstimatedIncome)}
                        </div>
                    </div>
                    <div class="bg-white/10 backdrop-blur rounded-xl p-3">
                        <div class="text-sm opacity-80">ยอดเงินคงเหลือ</div>
                        <div class="text-xl font-bold">
                            {formatCurrency(summary.availableBalance)}
                        </div>
                    </div>
                </div>
            </section>
        {/if}

        <!-- Filter Section -->
        <section class="px-4 mt-6">
            <div class="flex gap-2 bg-gray-100 rounded-xl p-1 overflow-x-auto">
                <button
                    class="min-w-20 py-2 px-3 rounded-lg font-medium transition-all {selectedFilter ===
                    'all'
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-gray-600'}"
                    on:click={() => (selectedFilter = "all")}
                >
                    ทั้งหมด
                </button>
                <button
                    class="min-w-[100px] py-2 px-3 rounded-lg font-medium transition-all {selectedFilter ===
                    'active'
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-gray-600'}"
                    on:click={() => (selectedFilter = "active")}
                >
                    กำลังดำเนินการ
                </button>
                <button
                    class="min-w-20 py-2 px-3 rounded-lg font-medium transition-all {selectedFilter ===
                    'completed'
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-gray-600'}"
                    on:click={() => (selectedFilter = "completed")}
                >
                    เสร็จสิ้น
                </button>
                <button
                    class="min-w-20 py-2 px-3 rounded-lg font-medium transition-all {selectedFilter ===
                    'cancelled'
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'text-gray-600'}"
                    on:click={() => (selectedFilter = "cancelled")}
                >
                    ยกเลิก
                </button>
            </div>
        </section>

        <!-- Investment List -->
        <section class="flex-1 px-4 mt-6 pb-20 overflow-y-auto">
            {#if filteredInvestments.length === 0}
                <div class="text-center py-12">
                    <div
                        class="text-6xl mdi mdi-inbox text-gray-300 mb-4"
                    ></div>
                    <p class="text-gray-500 text-lg">
                        {selectedFilter === "all"
                            ? "ไม่มีประวัติการลงทุน"
                            : `ไม่มีการลงทุน${selectedFilter === "active" ? "ที่กำลังดำเนินการ" : "ที่เสร็จสิ้น"}`}
                    </p>
                    <button
                        class="mt-4 bg-[#f59e0b] text-white px-6 py-3 rounded-xl font-medium"
                        on:click={() => goto("/my/Saving")}
                    >
                        เริ่มลงทุน
                    </button>
                </div>
            {:else}
                <div class="space-y-3">
                    {#each filteredInvestments as investment (investment.id)}
                        <article
                            class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <!-- Investment Header -->
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span
                                            class="text-lg font-bold text-gray-900"
                                        >
                                            {investment.rewardPercentage}%
                                        </span>
                                        <span
                                            class="px-2 py-1 text-xs font-medium rounded-full {getStatusClass(
                                                investment.status,
                                            )}"
                                        >
                                            {getStatusText(investment.status)}
                                        </span>
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        เริ่ม: {formatDate(
                                            investment.startDate,
                                        )}
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div
                                        class="text-xl font-bold text-gray-900"
                                    >
                                        {formatCurrency(investment.amount)}
                                    </div>
                                    <div class="text-xs text-gray-500">
                                        ยอดลงทุน
                                    </div>
                                </div>
                            </div>

                            <!-- Investment Details -->
                            <div class="grid grid-cols-2 gap-y-2 text-sm">
                                <div class="text-gray-600">อัตราผลตอบแทน</div>
                                <div
                                    class="text-right font-medium text-green-600"
                                >
                                    {investment.rewardPercentage}%
                                </div>

                                <div class="text-gray-600">ระยะเวลา</div>
                                <div class="text-right font-medium">
                                    {investment.duration} วัน
                                </div>

                                <div class="text-gray-600">กำไรสะสม</div>
                                <div
                                    class="text-right font-medium {getProfitClass(
                                        investment.profit || 0,
                                    )}"
                                >
                                    {formatCurrency(investment.profit || 0)}
                                </div>

                                <div class="text-gray-600">รายได้คาดการณ์</div>
                                <div
                                    class="text-right font-medium text-blue-600"
                                >
                                    {formatCurrency(
                                        investment.estimatedIncome || 0,
                                    )}
                                </div>
                            </div>

                            <!-- Auto Resubmit Status -->
                            <div class="mt-3 flex items-center justify-between">
                                <span class="text-gray-600"
                                    >ต่ออายุอัตโนมัติ</span
                                >
                                <span
                                    class="text-sm font-medium {investment.autoResubmit
                                        ? 'text-green-600'
                                        : 'text-gray-500'}"
                                >
                                    {investment.autoResubmit ? "เปิด" : "ปิด"}
                                </span>
                            </div>

                            <!-- Action Buttons -->
                            <div class="mt-3 flex gap-2">
                                {#if investment.status === "active"}
                                    <button
                                        class="flex-1 py-2 px-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                    >
                                        <span class="mdi mdi-eye mr-1"></span>
                                        ดูรายละเอียด
                                    </button>
                                {:else if investment.status === "completed"}
                                    <button
                                        class="flex-1 py-2 px-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                    >
                                        <span class="mdi mdi-check-circle mr-1"
                                        ></span>
                                        ดูผลลัพธ์
                                    </button>
                                {:else if investment.status === "cancelled"}
                                    <button
                                        class="flex-1 py-2 px-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                                    >
                                        <span class="mdi mdi-close-circle mr-1"
                                        ></span>
                                        ดูรายละเอียด
                                    </button>
                                {/if}
                            </div>
                        </article>
                    {/each}
                </div>
            {/if}
        </section>
    {/if}

    <!-- Bottom Navigation -->
    <nav
        class="fixed bottom-0 px-4 max-w-screen-sm w-full flex justify-between bg-blue-900 text-white"
    >
        <a href="/" class="p-2 flex flex-col items-center">
            <div class="mdi mdi-home text-3xl"></div>
            <div class="text-xl">หน้าหลัก</div>
        </a>
        <a href="/recharge" class="p-2 flex flex-col items-center">
            <div class="mdi mdi-credit-card text-3xl"></div>
            <div class="text-xl">ข้อมูล</div>
        </a>
        <a
            href="/my/investmentRecord"
            class="p-2 flex flex-col items-center text-sky-300"
        >
            <div class="mdi mdi-trending-up text-3xl"></div>
            <div class="text-xl">ประวัติ</div>
        </a>
        <a href="/my" class="p-2 flex flex-col items-center">
            <div class="mdi mdi-account text-3xl"></div>
            <div class="text-xl">ของฉัน</div>
        </a>
    </nav>
</main>
