import { DataTable } from "../_components/data-table"
import { SectionCards } from "../_components/section-cards"
import data from "../data.json"

export const metadata = {
  title: "Subscribers"
}

export default function subscribersPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <DataTable data={data} />
    </div>
  )
}
