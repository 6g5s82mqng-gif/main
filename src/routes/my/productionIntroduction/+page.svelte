<script>
    import { goto } from "$app/navigation";
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
        <div>
            <div class="max-w-3xl mx-auto p-5 bg-blue-900 shadow-lg rounded-lg">
                <h1
                    class="text-4xl font-extrabold text-center text-gray-900 mb-6"
                >
                    BNP Paribas
                </h1>
                <p class="text-white mb-5 leading-relaxed">
                    BNP Paribas เป็นธนาคารข้ามชาติที่ตั้งอยู่ในประเทศฝรั่งเศส
                    ซึ่งมีประวัติศาสตร์ที่ยาวนานและมีการรวมตัวของธนาคารหลายแห่ง
                    โดยที่มาของ BNP Paribas มีดังนี้:
                </p>
                <ul
                    class="list-disc list-inside text-white mb-5 leading-relaxed"
                >
                    <li>
                        <strong>ธนาคาร Banque Nationale de Paris (BNP):</strong>
                        ก่อตั้งในปี 1966 เมื่อเกิดการควบรวมระหว่างธนาคารสองแห่ง คือ
                        Banque Nationale de Crédit (ก่อตั้งในปี 1848) และ Banque
                        de Paris et des Pays-Bas (ก่อตั้งในปี 1872) ธนาคาร BNP กลายเป็นหนึ่งในธนาคารที่ใหญ่ที่สุดในฝรั่งเศสอย่างรวดเร็ว
                    </li>
                    <li>
                        <strong>ธนาคาร Paribas:</strong> มีประวัติศาสตร์ย้อนหลังไปถึงปี
                        1872 โดยเป็นธนาคารเพื่อการลงทุนและการค้าระดับนานาชาติ ซึ่งในช่วงศตวรรษที่
                        20 มีบทบาทสำคัญในตลาดการเงินและการลงทุน
                    </li>
                    <li>
                        <strong>การควบรวมกิจการ:</strong> ในปี 2000 ธนาคาร BNP ได้เข้าซื้อกิจการ
                        Paribas ทำให้เกิดธนาคาร BNP Paribas โดยถือเป็นการรวมตัวใหญ่ในอุตสาหกรรมการธนาคารยุโรป
                        และทำให้ BNP Paribas กลายเป็นหนึ่งในธนาคารที่มีขนาดใหญ่และมีอิทธิพลในระดับโลก
                    </li>
                </ul>
                <p class="text-white mb-5 leading-relaxed">
                    ในปัจจุบัน, BNP Paribas มีการดำเนินงานในหลากหลายด้าน
                    รวมถึงบริการธนาคารพาณิชย์, ธนาคารลงทุน, การบริหารสินทรัพย์,
                    และบริการด้านการประกันภัย
                    โดยมีสาขาและสำนักงานในหลายประเทศทั่วโลก
                </p>
                <br /><br /><br /><br /><br /><br /><br /><br />
            </div>
        </div>
    </div>
</main>
