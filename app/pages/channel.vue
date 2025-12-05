<script setup lang="ts">

</script>

<template>
    <nav class="flex items-center justify-between py-4">
        <NuxtLink to="/" class="text-xl">จัดการห้องแชนแนล</NuxtLink>
        <div class="flex items-center gap-4">
            <UModal title="สร้างแชนแนลใหม่">
                <UButton class="cursor-pointer" label="สร้างแชนแนลใหม่" color="secondary" variant="solid" />

                <template #body>
                    <form id="channel-form" @submit.prevent="">
                        <div class="mb-4">
                            <div class="text-sm">ชื่อแชนแนล</div>
                            <UInput type="text" class="w-full pt-2" />
                        </div>
                        <div class="mb-4">
                            <div class="text-sm">รายละเอียดของแชนแนล</div>
                            <UTextarea size="xl" placeholder="Type something..." class="w-full pt-2" />
                        </div>
                        <div class="flex justify-start gap-2 pt-4">
                            <UButton to="/channels/[id].vue" label="สร้าง" size="xl" type="submit" color="primary"
                                class="cursor-pointer" />
                        </div>
                    </form>
                </template>
            </UModal>

            <UserMenu />
        </div>
    </nav>

    <USeparator size="md" />

    <main class="mt-8 mx-100">
        <UEmpty icon="i-lucide-file" title="No projects found"
            description="It looks like you haven't added any projects. Create one to get started." variant='subtle'
            :actions="[
                {
                    icon: 'i-lucide-plus',
                    label: 'Create new'
                },
                {
                    icon: 'i-lucide-refresh-cw',
                    label: 'Refresh',
                    color: 'neutral',
                    variant: 'subtle'
                }
            ]" />
    </main>
</template>