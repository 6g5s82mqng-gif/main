<script lang="ts">
    import { auth } from "$lib/stores/auth";
    import { userService } from "$lib/services/userService";
    import { onMount } from "svelte";

    let user: any = null;
    let isAuthenticated = false;

    onMount(() => {
        // Initialize async operations
        const initAuth = async () => {
            const userInfo = await userService.getUserInfo();
            if (userInfo) {
                user = userInfo;
            }
        };

        const unsubscribe = auth.subscribe((authState) => {
            user = authState.user;
            isAuthenticated = authState.isAuthenticated;
        });

        // Execute async operations
        initAuth();

        return () => unsubscribe();
    });
</script>

<main class="max-w-screen-sm mx-auto text-lg mb-16">
    <div
        class="bg-[url('/my/bg-bnp.jpg')] text-center bg-cover grid gap-4 pt-6 -mt-2"
    >
        {#if isAuthenticated && user}
            <div class="bg-blue-900 font-bold w-fit rounded-r-full px-6 py-2">
                ID: {user.userId}
            </div>
            <img class="w-20 mx-auto" src="/my/login_logo.jpeg" alt="" />
            <div class="text-white text-xl font-bold">
                {user.username}
            </div>
            <div class="bg-blue-900 rounded-lg p-3 mx-3 grid grid-cols-2 gap-3">
                <div>
                    <div>{user.available_balance || 0}</div>
                    <div class="text-xs">ยอดเงินในบัญชี（THB）</div>
                </div>
                <div>
                    <div>{user.profit_loss?.toFixed(2) || "0.00"}</div>
                    <div class="text-xs">กำไรและขาดทุน（THB）</div>
                </div>
            </div>
            <div class="grid grid-cols-2 my-2 px-3">
                <a
                    href="/my/contactCustomer"
                    class="flex items-center justify-center gap-2 py-2"
                    ><span
                        class="text-[#f59e0b] text-2xl mdi mdi-database-refresh"
                    ></span> ฝากเงิน</a
                ><a
                    href="/my/withdrawCash"
                    class="flex items-center justify-center gap-2 py-2"
                    ><span
                        class="text-[#f59e0b] text-2xl mdi mdi-database-export"
                    ></span> ถอนเงิน</a
                >
            </div>
        {:else}
            <div class="bg-blue-900 font-bold w-fit rounded-r-full px-6 py-2">
                ID: Guest
            </div>
            <img class="w-20 mx-auto" src="/my/login_logo.jpeg" alt="" />
            <div class="flex items-center justify-center gap-2 py-2">
                <a href="/login" class=""
                    ><span class="text-[#f59e0b] text-2xl mdi mdi-account"
                    ></span> ล็อกอิน</a
                >
                /
                <a href="/register" class=""
                    ><span class="text-[#f59e0b] text-2xl mdi mdi-account"
                    ></span> ลงทะเบียน</a
                >
            </div>
            <div class="bg-blue-900 rounded-lg p-3 mx-3 grid grid-cols-2 gap-3">
                <div>
                    <div>{user?.available_balance || 0}</div>
                    <div class="text-xs">ยอดเงินในบัญชี（THB）</div>
                </div>
                <div>
                    <div>{user?.profit_loss?.toFixed(2) || "0.00"}</div>
                    <div class="text-xs">กำไรและขาดทุน（THB）</div>
                </div>
            </div>
            <div class="grid grid-cols-2 my-2">
                <a
                    href="/my/contactCustomer"
                    class="flex items-center justify-center gap-2 py-2"
                    ><span
                        class="text-[#f59e0b] text-2xl mdi mdi-database-refresh"
                    ></span> ฝากเงิน</a
                ><a
                    href="/my/withdrawCash"
                    class="flex items-center justify-center gap-2 py-2"
                    ><span
                        class="text-[#f59e0b] text-2xl mdi mdi-database-export"
                    ></span> ถอนเงิน</a
                >
            </div>
        {/if}
    </div>
    <div class="bg-[url('/my/bg-2.png')] bg-cover p-3 pb-20">
        <div class="border border-black text-black text-center rounded-xl p-3">
            <div class="grid grid-cols-3 gap-3">
                <a
                    href="/my/productionIntroduction"
                    class="bg-white rounded-xl p-3"
                    ><div
                        class="text-blue-900 text-4xl mdi mdi-file-document-multiple-outline"
                    ></div>
                    <div class="text-sm mt-2">แนะนำการผลิต</div></a
                ><a href="/my/fundDetails" class="bg-white rounded-xl p-3"
                    ><div class="text-blue-900 text-4xl mdi mdi-cash"></div>
                    <div class="text-sm mt-2">รายละเอียดกองทุน</div></a
                ><a href="/my/investmentRecord" class="bg-white rounded-xl p-3"
                    ><div
                        class="text-blue-900 text-4xl mdi mdi-file-document-multiple"
                    ></div>
                    <div class="text-sm mt-2">บันทึกการลงทุน</div></a
                ><a href="/my/Saving" class="bg-white rounded-xl p-3"
                    ><div
                        class="text-blue-900 text-4xl mdi mdi-shopping-outline"
                    ></div>
                    <div class="text-sm mt-2">กิจกรรมพิเศษ</div></a
                ><a href="/my/securityCenter" class="bg-white rounded-xl p-3"
                    ><div class="text-blue-900 text-4xl mdi mdi-security"></div>
                    <div class="text-sm mt-2">ศูนย์รักษาความปลอดภัย</div></a
                ><a href="/my/contactCustomer" class="bg-white rounded-xl p-3"
                    ><div class="text-blue-900 text-4xl mdi mdi-headset"></div>
                    <div class="text-sm mt-2">ติดต่อฝ่ายบริการ</div></a
                ><a href="/my/setup" class="bg-white rounded-xl p-3"
                    ><div class="text-blue-900 text-4xl mdi mdi-cog"></div>
                    <div class="text-sm mt-2">ตั้งค่า</div></a
                >
            </div>
        </div>
    </div>
    <div
        class="fixed bottom-0 px-4 max-w-screen-sm w-full flex justify-between bg-blue-900"
    >
        <a href="/" class="p-2"
            ><div class="mdi mdi-home text-3xl w-fit mx-auto"></div>
            <div class="text-xl">หน้าหลัก</div></a
        ><a href="/recharge" class="p-2"
            ><div class="mdi mdi-credit-card text-3xl w-fit mx-auto"></div>
            <div class="text-xl">ข้อมูล</div></a
        ><a href="/my/investmentRecord" class="p-2"
            ><div class="mdi mdi-trending-up text-3xl w-fit mx-auto"></div>
            <div class="text-xl">ประวัติ</div></a
        ><a
            href="/my"
            class="router-link-active router-link-exact-active p-2 text-sky-300"
            aria-current="page"
            ><div class="mdi mdi-account text-3xl w-fit mx-auto"></div>
            <div class="text-xl">ของฉัน</div></a
        >
    </div>
</main>
