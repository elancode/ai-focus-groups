"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { makeCustomPersona } from "@/lib/personas"
import type { Cohort, Persona } from "@/lib/types"

const COHORTS: Cohort[] = ["Gen Z", "Millennial", "Gen X", "Boomer"]

export function CustomPersonaSheet({
  onAdd,
}: {
  onAdd: (persona: Persona) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [archetype, setArchetype] = useState("")
  const [cohort, setCohort] = useState<Cohort>("Millennial")
  const [age, setAge] = useState("")
  const [occupation, setOccupation] = useState("")
  const [location, setLocation] = useState("")
  const [traits, setTraits] = useState("")
  const [bio, setBio] = useState("")

  function reset() {
    setName("")
    setArchetype("")
    setCohort("Millennial")
    setAge("")
    setOccupation("")
    setLocation("")
    setTraits("")
    setBio("")
  }

  function submit() {
    if (!name.trim() || !archetype.trim() || !bio.trim()) {
      toast.error("Add at least a name, archetype, and background.")
      return
    }
    onAdd(
      makeCustomPersona({
        name: name.trim(),
        archetype: archetype.trim(),
        cohort,
        age: Number.parseInt(age, 10) || 30,
        occupation: occupation.trim() || "Not specified",
        location: location.trim() || "Not specified",
        traits: traits
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 6),
        bio: bio.trim(),
      })
    )
    toast.success(`${name.trim()} added to the roster.`)
    reset()
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm">
            <PlusIcon data-icon="inline-start" />
            Add custom persona
          </Button>
        }
      />
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Design a custom persona</SheetTitle>
          <SheetDescription>
            Describe a participant and the panel agent will react in character.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <FieldGroup className="p-4">
            <div className="flex gap-3">
              <Field>
                <FieldLabel htmlFor="cp-name">Name</FieldLabel>
                <Input
                  id="cp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                />
              </Field>
              <Field className="max-w-24">
                <FieldLabel htmlFor="cp-age">Age</FieldLabel>
                <Input
                  id="cp-age"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="34"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="cp-arch">Archetype</FieldLabel>
              <Input
                id="cp-arch"
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
                placeholder="e.g. Frugal Frequent Traveler"
              />
            </Field>

            <div className="flex gap-3">
              <Field>
                <FieldLabel>Generation</FieldLabel>
                <Select
                  value={cohort}
                  onValueChange={(v) => setCohort(v as Cohort)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COHORTS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="cp-occ">Occupation</FieldLabel>
                <Input
                  id="cp-occ"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Nurse"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="cp-loc">Location</FieldLabel>
              <Input
                id="cp-loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Denver, CO"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="cp-traits">Traits</FieldLabel>
              <Input
                id="cp-traits"
                value={traits}
                onChange={(e) => setTraits(e.target.value)}
                placeholder="Comma separated, e.g. Frugal, Loyal, Cautious"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="cp-bio">Background</FieldLabel>
              <Textarea
                id="cp-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                placeholder="Describe their life, priorities, budget, and biases so the agent can react authentically."
              />
            </Field>
          </FieldGroup>
        </ScrollArea>

        <SheetFooter className="border-t">
          <Button onClick={submit}>Add to roster</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
