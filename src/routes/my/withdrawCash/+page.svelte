<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    let amount = "";
    let withdrawPassword = "";
    let isLoading = false;
    let errorMessage = "";
    let successMessage = "";
    let userBalance = 0;
    let hasBank = false;
    let hasCardPhoto = false;
    let userInfo: any = null;
    let bank: any = null;

    async function fetchUserBalance() {
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) return;

            const response = await fetch("/api/user/info", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();
            if (result.success) {
                userInfo = result.data;
                userBalance = result.data.available_balance;
                bank = result.data.bank;
                hasBank = result.data.bank;
                hasCardPhoto = result.data.cardphoto;
            }
        } catch (error) {
            console.error("Error fetching user balance:", error);
        }
    }

    onMount(() => {
        fetchUserBalance();
    });

    async function handleWithdraw() {
        if (!amount || !withdrawPassword) {
            errorMessage = "กรุณากรอกข้อมูลให้ครบถ้วน";
            return;
        }

        if (!hasBank || !hasCardPhoto) {
            errorMessage =
                "กรุณาเพิ่มบัญชีธนาคารและอัปโหลดรูปบัตรประชาชนก่อนถอนเงิน";
            return;
        }

        isLoading = true;
        errorMessage = "";
        successMessage = "";

        try {
            const response = await fetch("/api/withdraw/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                },
                body: JSON.stringify({
                    amount: amount,
                    withdrawPassword: withdrawPassword,
                }),
            });

            const result = await response.json();

            if (result.success) {
                successMessage = result.message;
                // Clear form after successful withdrawal
                amount = "";
                withdrawPassword = "";
                // Refresh user balance after successful withdrawal
                await fetchUserBalance();
                // Optionally redirect or refresh user data
                setTimeout(() => {
                    goto("/my");
                }, 2000);
            } else {
                errorMessage = result.message;
            }
        } catch (error) {
            errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่";
        } finally {
            isLoading = false;
        }
    }
</script>

<main class="max-w-screen-sm h-dvh flex flex-col mx-auto text-lg">
    <div class="relative bg-primary text-center py-5">
        <div class="relative bg-[#f59e0b] text-center py-5">
            <button
                class="text-5xl mdi mdi-chevron-left absolute left-0 top-1/2 -translate-y-1/2"
                title="กลับหน้าหลัก"
                aria-label="กลับหน้าหลัก"
            ></button>
            <div class="leading-none text-xl"></div>
        </div>
        <div class="leading-none text-xl"></div>
    </div>
    <div class="grow">
        <div class="bg-cover bg-[url('/my/bg-1.png')] text-center p-16">
            ถอนเงิน <div class="text-4xl mt-3">
                {userBalance || "0"}
            </div>
        </div>
        <div class="bg-cover bg-[url('/my/bg-2.png')] text-black h-[400px] p-4">
            <div class="grid gap-6 divide divide-black">
                <div class="flex gap-3">
                    <div class="text-second text-6xl mdi mdi-bank-circle"></div>
                    <div>
                        {bank?.number || 0}
                        <div>{bank?.bank_name || ""}</div>
                    </div>
                </div>
                <div>
                    <div
                        class="flex gap-2 items-center rounded-full bg-white px-4 py-1"
                    >
                        <div class="text-primary text-4xl mdi mdi-cash"></div>
                        <input
                            type="text"
                            placeholder="กรุณาใส่จำนวนเงินที่ต้องการถอน"
                            class="outline-none focus:ring-0 border-0 w-full"
                            bind:value={amount}
                        />
                    </div>
                    <!---->
                </div>
                <div>
                    <div
                        class="flex gap-2 items-center rounded-full bg-white px-4 py-1"
                    >
                        <div class="text-primary text-4xl mdi mdi-lock"></div>
                        <input
                            type="password"
                            placeholder="กรุณาใส่รหัสผ่านการถอน"
                            class="outline-none focus:ring-0 border-0 w-full"
                            bind:value={withdrawPassword}
                        />
                    </div>
                    <!---->
                </div>
                <button
                    class="bg-blue-900 rounded-full py-3"
                    onclick={handleWithdraw}
                    disabled={isLoading || !hasBank || !hasCardPhoto}
                >
                    {isLoading ? "กำลังดำเนินการ..." : "ถอนเงิน"}
                </button>
                {#if !hasBank || !hasCardPhoto}
                    <div class="text-red-500 text-sm mt-2 text-center">
                        กรุณาเพิ่มบัญชีธนาคารและอัปโหลดรูปบัตรประชาชนก่อนถอนเงิน
                    </div>
                {/if}
            </div>
        </div>
        {#if errorMessage}
            <div class="text-red-500 text-sm mt-2 text-center">
                {errorMessage}
            </div>
        {/if}
        {#if successMessage}
            <div class="text-green-500 text-sm mt-2 text-center">
                {successMessage}
            </div>
        {/if}
    </div>
</main>
