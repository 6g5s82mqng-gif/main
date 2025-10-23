<script lang="ts">
    import { alerts } from "$lib/stores/alert";

    interface Alert {
        id: string;
        message: string;
        type: "success" | "error" | "warning" | "info";
        duration?: number;
    }

    let alertList: Alert[];
    $: alertList = $alerts;

    function getAlertClasses(type: string) {
        const baseClasses =
            "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-in-out";

        switch (type) {
            case "success":
                return `${baseClasses} bg-green-500 text-white border-l-4 border-green-700`;
            case "error":
                return `${baseClasses} bg-red-500 text-white border-l-4 border-red-700`;
            case "warning":
                return `${baseClasses} bg-yellow-500 text-black border-l-4 border-yellow-700`;
            case "info":
            default:
                return `${baseClasses} bg-blue-500 text-white border-l-4 border-blue-700`;
        }
    }

    function getIcon(type: string) {
        switch (type) {
            case "success":
                return "mdi-check-circle";
            case "error":
                return "mdi-alert-circle";
            case "warning":
                return "mdi-alert";
            case "info":
            default:
                return "mdi-information";
        }
    }
</script>

{#each alertList as alert (alert.id)}
    <div class={getAlertClasses(alert.type)} role="alert">
        <div class="flex items-center">
            <div class="shrink-0">
                <i class="mdi {getIcon(alert.type)} text-2xl"></i>
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium">{alert.message}</p>
            </div>
        </div>
    </div>
{/each}
