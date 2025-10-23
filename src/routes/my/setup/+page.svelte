<script lang="ts">
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth";
    import { alerts } from "$lib/stores/alert";

    function handleSwitchAccount() {
        auth.logout();
        goto("/login");
    }
</script>

<main class="max-w-screen-sm h-dvh flex flex-col mx-auto text-lg">
    <div class="relative bg-[#f59e0b] text-center py-5">
        <button
            class="text-5xl mdi mdi-chevron-left absolute left-0 top-1/2 -translate-y-1/2"
            on:click={() => goto("/my")}
            title="กลับ"
            aria-label="กลับ"
        ></button>
        <div class="leading-none text-xl"></div>
    </div>
    <div class="grow">
        <div
            class="bg-cover bg-[url('/my/bg-2.png')] h-full flex flex-col gap-4 p-4"
        >
            <a
                href="/my/languageSettings"
                class="rounded-lg bg-stone-700 px-2 py-4 flex items-center justify-between"
                >การตั้งค่าภาษา <div
                    class="text-4xl mdi mdi-chevron-right"
                ></div></a
            >
            <button
                class="rounded-lg bg-stone-700 px-2 py-4 flex items-center justify-between w-full text-left"
                on:click={handleSwitchAccount}
            >
                สลับบัญชี <div class="text-4xl mdi mdi-chevron-right"></div>
            </button>
        </div>
    </div>
</main>
