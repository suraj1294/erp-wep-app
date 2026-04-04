import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CreateCompanyWizard } from "@/components/create-company-wizard"

export default function CreateCompanyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-[75vw]">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
              T
            </div>
          </div>
          <CardTitle className="text-2xl">Create Your Company</CardTitle>
          <CardDescription>
            Set up your first company to get started with Tally ERP
          </CardDescription>
        </CardHeader>
        <CreateCompanyWizard />
      </Card>
    </div>
  )
}
