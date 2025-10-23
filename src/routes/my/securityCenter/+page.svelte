<main class="max-w-screen-sm h-dvh flex flex-col mx-auto text-lg">
    <div class="relative bg-[#f59e0b] text-center py-5">
        <button
            class="text-5xl mdi mdi-chevron-left absolute left-0 top-1/2 -translate-y-1/2"
        ></button>
        <div class="leading-none text-xl"></div>
    </div>
    <div class="grow">
        <div class="h-full flex flex-col">
            <div
                class="bg-cover bg-[url('/my/bg-1.png')] flex items-center justify-between gap-4 px-6 py-10"
            >
                <div class="text-5xl mdi mdi-security"></div>
                <div class="text-xl">ระดับความปลอดภัย</div>
                <div class="flex gap-2">
                    <div class="bg-white rounded-full h-1 w-6"></div>
                    <div class="bg-white rounded-full h-1 w-6"></div>
                    <div class="bg-white rounded-full h-1 w-6 opacity-50"></div>
                </div>
                <div>กลาง</div>
            </div>
            <div
                class="grow bg-cover bg-[url('/my/bg-2.png')] text-black flex flex-col divide-y divide-black"
            >
                <div class="flex justify-between px-6 py-3">
                    <div class="flex items-center gap-4">
                        <span class="text-yellow-700 text-3xl mdi mdi-lock"
                        ></span> รหัสผ่านเข้าสู่ระบบ
                    </div>
                    <div class="flex items-center">
                        ตกลง <a
                            href="/my/securityCenter/loginPassword"
                            class="text-4xl mdi mdi-chevron-right"
                        ></a>
                    </div>
                </div>
                <div class="flex justify-between px-6 py-3">
                    <div class="flex items-center gap-4">
                        <span
                            class="text-yellow-700 text-3xl mdi mdi-lock-open-plus-outline"
                        ></span> รหัสผ่านการถอน
                    </div>
                    <div class="flex items-center">
                        ตกลง <a
                            href="/my/securityCenter/withdrawPassword"
                            class="text-4xl mdi mdi-chevron-right"
                        ></a>
                    </div>
                </div>
                <div class="flex justify-between px-6 py-3">
                    <div class="flex items-center gap-4">
                        <span
                            class="text-yellow-700 text-3xl mdi mdi-card-account-details-star"
                        ></span> เพิ่มบัตรธนาคาร
                    </div>
                    <div class="flex items-center">
                        ตกลง <a
                            href="/my/securityCenter/addABankCard"
                            class="text-4xl mdi mdi-chevron-right"
                        ></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>
