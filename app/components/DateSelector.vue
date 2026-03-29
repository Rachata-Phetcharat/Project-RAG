<script setup lang="ts">
import { DateFormatter, getLocalTimeZone, CalendarDate, today } from '@internationalized/date'

// แนะนำให้สร้างไฟล์ types/index.ts หรือนิยามไว้ที่นี่
export interface DateRange {
    start: Date
    end: Date
}

const df = new DateFormatter('en-US', {
    dateStyle: 'medium'
})

// รับค่าผ่าน defineModel เพื่อเชื่อมต่อกับหน้าหลัก (v-model)
const selected = defineModel<DateRange>({ required: true })

const ranges = [
    { label: 'วันนี้', days: 0 },
    { label: '7 วันล่าสุด', days: 7 },
    { label: '14 วันล่าสุด', days: 14 },
    { label: '30 วันล่าสุด', days: 30 },
    { label: '3 เดือนล่าสุด', months: 3 },
    { label: '6 เดือนล่าสุด', months: 6 },
    { label: '1 ปีล่าสุด', years: 1 }
]

// Helper: แปลง Date เป็น CalendarDate สำหรับ UCalendar
const toCalendarDate = (date: Date) => {
    return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}

// Computed สำหรับเชื่อมกับ UCalendar
const calendarRange = computed({
    get: () => ({
        start: selected.value.start ? toCalendarDate(selected.value.start) : undefined,
        end: selected.value.end ? toCalendarDate(selected.value.end) : undefined
    }),
    set: (newValue: { start: any, end: any }) => {
        if (newValue.start && newValue.end) {
            selected.value = {
                start: newValue.start.toDate(getLocalTimeZone()),
                end: newValue.end.toDate(getLocalTimeZone())
            }
        }
    }
})

const isRangeSelected = (range: { days?: number, months?: number, years?: number }) => {
    if (!selected.value.start || !selected.value.end) return false

    const currentDate = today(getLocalTimeZone())
    let startDate = currentDate.copy()

    if (range.days !== undefined) startDate = startDate.subtract({ days: range.days })
    else if (range.months) startDate = startDate.subtract({ months: range.months })
    else if (range.years) startDate = startDate.subtract({ years: range.years })

    const selectedStart = toCalendarDate(selected.value.start)
    const selectedEnd = toCalendarDate(selected.value.end)

    return selectedStart.compare(startDate) === 0 && selectedEnd.compare(currentDate) === 0
}

const selectRange = (range: { days?: number, months?: number, years?: number }) => {
    const endDate = today(getLocalTimeZone())
    let startDate = endDate.copy()

    if (range.days !== undefined) startDate = startDate.subtract({ days: range.days })
    else if (range.months) startDate = startDate.subtract({ months: range.months })
    else if (range.years) startDate = startDate.subtract({ years: range.years })

    selected.value = {
        start: startDate.toDate(getLocalTimeZone()),
        end: endDate.toDate(getLocalTimeZone())
    }
}
</script>

<template>
    <!-- [RESPONSIVE] w-[calc(100vw-2rem)] บน mobile ป้องกัน popover ล้นจอ -->
    <UPopover :content="{ align: 'start' }" :modal="true" :ui="{ content: 'max-w-[calc(100vw-2rem)] sm:max-w-none' }">
        <UButton color="neutral" variant="subtle" icon="i-heroicons-calendar-days" class="group">
            <span class="truncate">
                <template v-if="selected.start && selected.end">
                    <!-- {{ df.format(selected.start) }} - {{ df.format(selected.end) }}  -->
                    {{ranges.find(r => isRangeSelected(r)) ? `${ranges.find(r => isRangeSelected(r))!.label}` : ''}}
                </template>
                <template v-else>
                    เลือกวันที่
                </template>
            </span>

            <template #trailing>
                <UIcon name="i-heroicons-chevron-down"
                    class="shrink-0 text-gray-400 size-4 group-data-[state=open]:rotate-180 transition-transform duration-200" />
            </template>
        </UButton>

        <template #content>
            <!-- [RESPONSIVE] mobile: stack แนวตั้ง, sm+: แถวข้าง -->
            <div
                class="flex flex-col sm:flex-row sm:items-stretch sm:divide-x divide-gray-200 dark:divide-gray-800 w-full">

                <!-- Range shortcuts — mobile: wrap หลายบรรทัด, sm+: list แนวตั้ง -->
                <div class="flex flex-wrap sm:flex-col gap-1 px-2 py-2 border-b sm:border-b-0 sm:py-2 sm:min-w-[140px]">
                    <UButton v-for="(range, index) in ranges" :key="index" :label="range.label" color="neutral"
                        variant="ghost"
                        class="sm:rounded-none sm:px-6 sm:justify-start font-normal rounded-full px-3 text-xs sm:text-sm"
                        :class="[isRangeSelected(range) ? 'bg-gray-100 dark:bg-gray-800 font-medium' : '']" truncate
                        @click="selectRange(range)" />
                </div>

                <!-- Calendar — mobile: 1 เดือน, sm+: 2 เดือน -->
                <div class="p-2">
                    <div class="hidden sm:block">
                        <UCalendar v-model="calendarRange" :number-of-months="2" range />
                    </div>
                    <div class="sm:hidden">
                        <UCalendar v-model="calendarRange" :number-of-months="1" range />
                    </div>
                </div>
            </div>
        </template>
    </UPopover>
</template>