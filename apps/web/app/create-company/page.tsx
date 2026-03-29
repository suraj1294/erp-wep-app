import { redirect } from "next/navigation"
import { db } from "@workspace/db/client"
import { companies, companyUsers } from "@workspace/db/schema"
import { seedCompanyDefaults } from "@workspace/db/seeds/company-defaults"
import { requireSession } from "@/lib/auth-server"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Button } from "@workspace/ui/components/button"

async function createCompanyAction(formData: FormData) {
  "use server"

  const session = await requireSession()
  const name = (formData.get("name") as string).trim()
  const displayName = (formData.get("displayName") as string | null)?.trim() || null

  if (!name) throw new Error("Company name is required")

  const [company] = await db
    .insert(companies)
    .values({ name, displayName, createdBy: session.user.id })
    .returning()

  await db.insert(companyUsers).values({
    companyId: company!.id,
    userId: session.user.id,
    role: "owner",
  })

  // Seed standard account groups, accounts, voucher types, UoM and location
  await seedCompanyDefaults(company!.id)

  redirect(`/${company!.id}`)
}

export default function CreateCompanyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
              T
            </div>
          </div>
          <CardTitle className="text-2xl">Create Your Company</CardTitle>
          <CardDescription>
            Set up your first company to get started with Tally ERP
          </CardDescription>
        </CardHeader>
        <form action={createCompanyAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Acme Corporation"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Acme Corp"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Create Company
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
