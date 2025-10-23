<script lang="ts">
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth";
    import { alerts } from "$lib/stores/alert";

    let username = "";
    let password = "";
    let confirmPassword = "";
    let isLoading = false;

    async function handleRegister() {
        if (!username || !password || !confirmPassword) {
            alerts.error("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        if (password !== confirmPassword) {
            alerts.error("รหัสผ่านไม่ตรงกัน");
            return;
        }

        if (password.length < 6) {
            alerts.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
            return;
        }

        isLoading = true;

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password, confirmPassword }),
            });

            const result = await response.json();

            if (result.success) {
                auth.login(result.data.access_token, result.data.user);
                alerts.success(result.message);
                goto("/my");
            } else {
                alerts.error(result.message);
            }
        } catch (error) {
            console.error("Registration error:", error);
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
            on:click={() => goto("/")}
            title="กลับหน้าหลัก"
            aria-label="กลับหน้าหลัก"
        ></button>
        <div class="leading-none text-xl"></div>
    </div>
    <div class="grow">
        <div
            class="bg-cover bg-[url('/login-bg.jpg')] h-screen -mt-[60px] pt-[60px] text-black text-xl"
        >
            <img class="w-24 py-10 mx-auto" src="/my/login_logo.jpeg" alt="" />
            <div class="grid gap-6 px-6">
                <div>
                    <div
                        class="flex gap-2 items-center rounded-full bg-white px-4 py-1"
                    >
                        <div
                            class="text-[#f59e0b] text-4xl mdi mdi-account"
                        ></div>
                        <input
                            type="text"
                            placeholder="กรุณาใส่ชื่อผู้ใช้/โทรศัพท์ของคุณ"
                            class="outline-none focus:ring-0 border-0 w-full"
                            bind:value={username}
                            on:keydown={(e) =>
                                e.key === "Enter" && handleRegister()}
                        />
                    </div>
                </div>
                <div>
                    <div
                        class="flex gap-2 items-center rounded-full bg-white px-4 py-1"
                    >
                        <div class="text-[#f59e0b] text-4xl mdi mdi-lock"></div>
                        <input
                            type="password"
                            placeholder="กรุณาใส่รหัสผ่าน"
                            class="outline-none focus:ring-0 border-0 w-full"
                            bind:value={password}
                            on:keydown={(e) =>
                                e.key === "Enter" && handleRegister()}
                        />
                    </div>
                </div>
                <div>
                    <div
                        class="flex gap-2 items-center rounded-full bg-white px-4 py-1"
                    >
                        <div class="text-[#f59e0b] text-4xl mdi mdi-lock"></div>
                        <input
                            type="password"
                            placeholder="กรุณายืนยันรหัสผ่าน"
                            class="outline-none focus:ring-0 border-0 w-full"
                            bind:value={confirmPassword}
                            on:keydown={(e) =>
                                e.key === "Enter" && handleRegister()}
                        />
                    </div>
                </div>
                <button
                    class="bg-blue-900 rounded-full py-3 text-white disabled:opacity-50"
                    on:click={handleRegister}
                    disabled={isLoading}
                >
                    {#if isLoading}
                        <span class="mdi mdi-loading mdi-spin"></span>
                        กำลังลงทะเบียน...
                    {:else}
                        ลงทะเบียนตอนนี้
                    {/if}
                </button>
                <a href="/login" class="text-center text-base"
                    >เข้าสู่บัญชีที่มีอยู่</a
                >
            </div>
        </div>
    </div>
</main>
