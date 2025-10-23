<script lang="ts">
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth";
    import { alerts } from "$lib/stores/alert";

    let oldPassword = "";
    let newPassword = "";
    let confirmNewPassword = "";
    let isLoading = false;
    let token: string | null = null;

    $: token = $auth.token;

    async function handleChangePassword() {
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            alerts.error("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alerts.error("รหัสผ่านใหม่ไม่ตรงกัน");
            return;
        }

        if (newPassword.length < 6) {
            alerts.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
            return;
        }

        isLoading = true;

        try {
            const response = await fetch(
                "/api/user/bank/update-withdraw-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        oldPassword,
                        newPassword,
                        confirmNewPassword,
                    }),
                },
            );

            const result = await response.json();

            if (result.success) {
                alerts.success(result.message);
                // Clear form
                oldPassword = "";
                newPassword = "";
                confirmNewPassword = "";
                goto("/my/securityCenter");
            } else {
                alerts.error(result.message);
            }
        } catch (error) {
            console.error("Change password error:", error);
            alerts.error("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่");
        } finally {
            isLoading = false;
        }
    }
</script>

<main class="max-w-screen-sm h-dvh flex flex-col mx-auto text-lg">
    <div class="relative bg-[#f59e0b] text-center py-5">
        <button
            class="text-5xl mdi mdi-chevron-left absolute left-0 top-1/2 -translate-y-1/2"
            title="กลับ"
            aria-label="กลับ"
            on:click={() => goto("/my/securityCenter")}
        ></button>
        <div class="leading-none text-xl"></div>
    </div>
    <div class="grow">
        <div class="h-full px-6 bg-cover bg-[url('/my/bg-2.png')]">
            <!---->
            <div class="flex flex-col divide-y divide-black">
                <div class="text-black flex gap-2 py-4">
                    <label for="oldPassword" class="shrink-0"
                        >รหัสผ่านเก่า</label
                    ><input
                        id="oldPassword"
                        type="password"
                        bind:value={oldPassword}
                        placeholder="กรุณาใส่รหัสผ่านเก่า"
                        class="grow bg-transparent outline-none ring-0 border-0"
                        on:keydown={(e) =>
                            e.key === "Enter" && handleChangePassword()}
                    />
                </div>
                <div class="text-black flex gap-2 py-4">
                    <label for="newPassword" class="shrink-0"
                        >รหัสผ่านใหม่</label
                    ><input
                        id="newPassword"
                        type="password"
                        bind:value={newPassword}
                        placeholder="กรุณาใส่รหัสผ่านใหม่"
                        class="grow bg-transparent outline-none ring-0 border-0"
                        on:keydown={(e) =>
                            e.key === "Enter" && handleChangePassword()}
                    />
                </div>
                <div class="text-black flex gap-2 py-4">
                    <label for="confirmNewPassword" class="shrink-0"
                        >ยืนยันรหัสผ่านใหม่</label
                    ><input
                        id="confirmNewPassword"
                        type="password"
                        bind:value={confirmNewPassword}
                        placeholder="ยืนยันรหัสผ่านใหม่"
                        class="grow bg-transparent outline-none ring-0 border-0"
                        on:keydown={(e) =>
                            e.key === "Enter" && handleChangePassword()}
                    />
                </div>
                <div class="text-sm text-gray-400 text-right pt-2">
                    บัญชีไม่มีวิธีการตรวจสอบ โปรดลืมรหัสผ่านเก่า <a
                        href="/my/contactCustomer"
                        class="text-red-600">ติดต่อฝ่ายบริการ</a
                    >
                </div>
            </div>
            <button
                class="bg-yellow-700 w-full mt-6 rounded py-2 text-white disabled:opacity-50"
                on:click={handleChangePassword}
                disabled={isLoading}
            >
                {#if isLoading}
                    <span class="mdi mdi-loading mdi-spin"></span>
                    กำลังบันทึก...
                {:else}
                    ตกลง
                {/if}
            </button>
        </div>
    </div>
</main>
