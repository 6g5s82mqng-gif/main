<script lang="ts">
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth";
    import { alerts } from "$lib/stores/alert";
    import { onMount } from "svelte";

    let selectedBank = "";
    let bankName = "";
    let realName = "";
    let bankCardNumber = "";
    let withdrawNumber = "";
    let cardPhoto: File | string = "";
    let isLoading = false;
    let token: string | null = null;
    let hasBankInfo = false;
    let userInfo: any = null;

    $: token = $auth.token;

    const bankOptions = {
        bbl: "Bangkok Bank",
        ktb: "Krung Thai Bank",
        kbank: "Kasikorn Bank",
        bay: "Bank of Ayudhya",
        kkp: "Kiatnakin Bank",
        scb: "Siam Commercial Bank",
        cimb: "CIMB Thai Bank",
        ttb: "TMB Bank Thanachart",
        ldb: "LDB Bank",
        bcel: "BCEL Bank",
        others: "Others",
    };

    onMount(async () => {
        if (token) {
            await loadUserInfo();
        }
    });

    async function loadUserInfo() {
        try {
            const response = await fetch("/api/user/info", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (result.success) {
                userInfo = result.data;
                if (userInfo.bank) {
                    hasBankInfo = true;
                    bankName = userInfo.bank.bank_name;
                    realName = userInfo.bank.fullname;
                    bankCardNumber = userInfo.bank.number;
                    cardPhoto = userInfo.bank.cardphoto || "";
                    // Find the bank code from the name
                    const bankCode =
                        Object.entries(bankOptions).find(
                            ([, name]) => name === bankName,
                        )?.[0] || "";
                    selectedBank = bankCode;
                }
            }
        } catch (error) {
            console.error("Load user info error:", error);
        }
    }

    function handleBankChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        selectedBank = target.value;
        bankName = bankOptions[selectedBank as keyof typeof bankOptions] || "";
    }

    function handleCardPhotoSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alerts.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
            target.value = "";
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alerts.error("ขนาดไฟล์ต้องไม่เกิน 5MB");
            target.value = "";
            return;
        }

        // Store the file for later upload
        cardPhoto = file;
        alerts.success("เลือกรูปภาพสำเร็จ");
    }

    async function handleAddBank() {
        if (
            !selectedBank ||
            !realName ||
            !bankCardNumber ||
            !withdrawNumber ||
            !cardPhoto
        ) {
            alerts.error("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        if (bankCardNumber.length < 10) {
            alerts.error("เลขบัญชีต้องมีอย่างน้อย 10 หลัก");
            return;
        }

        isLoading = true;

        try {
            // Send as FormData to handle image upload
            const formData = new FormData();
            formData.append("bank_name", bankName);
            formData.append("number", bankCardNumber);
            formData.append("fullname", realName);
            formData.append("withdrawNumber", withdrawNumber);

            // Handle cardPhoto - if it's a File object, append it, otherwise it's already a URL string
            if (typeof cardPhoto === "object" && cardPhoto instanceof File) {
                formData.append("cardphoto", cardPhoto);
            } else if (typeof cardPhoto === "string" && cardPhoto) {
                // For existing bank info, convert string URL back to a placeholder file
                // This won't be used since we only handle new bank additions
                alerts.error("กรุณาเลือกรูปภาพใหม่");
                isLoading = false;
                return;
            }

            const response = await fetch("/api/user/bank/add", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                alerts.success(result.message);
                await loadUserInfo(); // Reload user info to get updated bank data
            } else {
                alerts.error(result.message);
            }
        } catch (error) {
            console.error("Add bank error:", error);
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
            <div class="flex flex-col divide-y divide-black">
                <div class="text-black flex gap-2 py-4 items-center">
                    <label for="bankSelect" class="shrink-0">ธนาคาร</label>
                    {#if hasBankInfo}
                        <select
                            id="bankSelect"
                            value={selectedBank}
                            disabled
                            class="grow bg-white/50 backdrop-blur-sm outline-none ring-0 border border-gray-300 rounded-lg px-3 py-2 text-black shadow-sm opacity-75 cursor-not-allowed"
                        >
                            <option value={selectedBank}>{bankName}</option>
                        </select>
                    {:else}
                        <select
                            id="bankSelect"
                            bind:value={selectedBank}
                            on:change={handleBankChange}
                            class="grow bg-white/90 backdrop-blur-sm outline-none ring-0 border border-gray-300 rounded-lg px-3 py-2 text-black shadow-sm focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 transition-all"
                        >
                            <option value="">Please select a bank</option>
                            <option value="bbl">Bangkok Bank</option>
                            <option value="ktb">Krung Thai Bank</option>
                            <option value="kbank">Kasikorn Bank</option>
                            <option value="bay">Bank of Ayudhya</option>
                            <option value="kkp">Kiatnakin Bank</option>
                            <option value="scb">Siam Commercial Bank</option>
                            <option value="cimb">CIMB Thai Bank</option>
                            <option value="ttb">TMB Bank Thanachart</option>
                            <option value="ldb">LDB Bank</option>
                            <option value="bcel">BCEL Bank</option>
                            <option value="others">Others</option>
                        </select>
                    {/if}
                </div>
                <div class="text-black flex gap-2 py-4">
                    <label for="realName" class="shrink-0">ชื่อจริง</label
                    ><input
                        id="realName"
                        type="text"
                        bind:value={realName}
                        placeholder="กรุณาใส่ชื่อจริงของคุณ"
                        class="grow bg-transparent outline-none ring-0 border-0"
                        disabled={hasBankInfo}
                        class:opacity-50={hasBankInfo}
                        class:cursor-not-allowed={hasBankInfo}
                    />
                </div>
                <div class="text-black flex gap-2 py-4">
                    <label for="bankCardNumber" class="shrink-0"
                        >หมายเลขบัตรธนาคาร</label
                    ><input
                        id="bankCardNumber"
                        type="text"
                        bind:value={bankCardNumber}
                        placeholder="กรุณาใส่หมายเลขบัตร"
                        class="grow bg-transparent outline-none ring-0 border-0"
                        disabled={hasBankInfo}
                        class:opacity-50={hasBankInfo}
                        class:cursor-not-allowed={hasBankInfo}
                    />
                </div>
                <div class="text-black flex gap-2 py-4">
                    <label for="bankAddress" class="shrink-0">ชื่อธนาคาร</label
                    ><input
                        id="bankAddress"
                        type="text"
                        bind:value={bankName}
                        placeholder="กรุณาใส่ชื่อธนาคารของคุณ"
                        class="grow bg-transparent outline-none ring-0 border-0"
                        disabled={hasBankInfo}
                        class:opacity-50={hasBankInfo}
                        class:cursor-not-allowed={hasBankInfo}
                    />
                </div>
                <div class="text-black flex gap-2 py-4">
                    <label for="withdrawNumber" class="shrink-0"
                        >รหัสผ่านถอนใหม่</label
                    >
                    {#if hasBankInfo}
                        <input
                            id="withdrawNumber"
                            type="text"
                            value="********"
                            placeholder="รหัสผ่านถอน"
                            class="grow bg-transparent outline-none ring-0 border-0 opacity-50 cursor-not-allowed"
                            readonly
                        />
                    {:else}
                        <input
                            id="withdrawNumber"
                            type="password"
                            bind:value={withdrawNumber}
                            placeholder="กรุณาใส่รหัสผ่านถอนใหม่"
                            class="grow bg-transparent outline-none ring-0 border-0"
                        />
                    {/if}
                </div>
                <div class="text-black flex gap-2 py-4">
                    <label for="cardPhoto" class="shrink-0"
                        >รูปบัตรประชาชน</label
                    >
                    {#if hasBankInfo}
                        {#if cardPhoto}
                            <div class="grow">
                                <img
                                    src={cardPhoto}
                                    alt="ID Card"
                                    class="h-20 object-cover rounded"
                                />
                                <div class="text-xs text-gray-600 mt-1">
                                    อัปโหลดแล้ว
                                </div>
                            </div>
                        {:else}
                            <div class="grow opacity-50">
                                <div class="text-sm">ยังไม่ได้อัปโหลด</div>
                            </div>
                        {/if}
                    {:else}
                        <div class="grow">
                            <input
                                id="cardPhoto"
                                type="file"
                                accept="image/*"
                                on:change={handleCardPhotoSelect}
                                disabled={isLoading}
                                class="w-full text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-white/90 file:text-black file:cursor-pointer hover:file:bg-white"
                            />
                            {#if cardPhoto}
                                <div class="mt-2">
                                    {#if typeof cardPhoto === "object"}
                                        <img
                                            src={URL.createObjectURL(cardPhoto)}
                                            alt="ID Card Preview"
                                            class="h-16 object-cover rounded"
                                        />
                                        <div
                                            class="text-xs text-green-600 mt-1"
                                        >
                                            เลือกรูปภาพสำเร็จ
                                        </div>
                                    {:else}
                                        <img
                                            src={cardPhoto}
                                            alt="ID Card"
                                            class="h-16 object-cover rounded"
                                        />
                                        <div
                                            class="text-xs text-green-600 mt-1"
                                        >
                                            อัปโหลดแล้ว
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
            {#if hasBankInfo}
                <button
                    class="bg-gray-600 w-full mt-6 rounded py-2 text-white opacity-75 cursor-not-allowed"
                    disabled
                >
                    <span class="mdi mdi-check-circle"></span>
                    บัญชีธนาคารถูกเพิ่มแล้ว
                </button>
            {:else}
                <button
                    class="bg-red-800 w-full mt-6 rounded py-2 text-white disabled:opacity-50"
                    on:click={handleAddBank}
                    disabled={isLoading}
                >
                    {#if isLoading}
                        <span class="mdi mdi-loading mdi-spin"></span>
                        กำลังบันทึก...
                    {:else}
                        ตกลง
                    {/if}
                </button>
            {/if}
        </div>
    </div>
</main>
