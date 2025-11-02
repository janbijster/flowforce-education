import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Student,
  fetchStudent,
  createStudent,
  updateStudent,
  fetchStudentGroups,
  StudentGroup,
} from "@/lib/api";

export default function StudentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreate = id === "new" || !id;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const groups = await fetchStudentGroups();
        setStudentGroups(groups);

        if (!isCreate && id) {
          const student = await fetchStudent(Number(id));
          setFirstName(student.first_name);
          setLastName(student.last_name);
          setEmail(student.email);
          setSelectedGroups(student.student_groups || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isCreate]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      if (!firstName.trim()) {
        setError("First name is required");
        setSaving(false);
        return;
      }

      if (!lastName.trim()) {
        setError("Last name is required");
        setSaving(false);
        return;
      }

      if (!email.trim()) {
        setError("Email is required");
        setSaving(false);
        return;
      }

      if (selectedGroups.length === 0) {
        setError("At least one student group is required");
        setSaving(false);
        return;
      }

      const payload: Partial<Student> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        student_groups: selectedGroups,
        organization: user.organization.id,
      };

      if (isCreate) {
        const created = await createStudent(payload);
        navigate(`/students/${created.id}`);
      } else if (id) {
        await updateStudent(Number(id), payload);
        navigate(`/students/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save student");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>{isCreate ? "Create Student" : "Edit Student"}</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{isCreate ? "Create Student" : "Edit Student"}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(isCreate ? "/students" : `/students/${id}`)}>
            Back
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </PageHeader>

      {error && <div className="text-destructive mb-4">{error}</div>}

      <div className="rounded-md border p-4 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">
            First Name <span className="text-destructive">*</span>
          </label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Last Name <span className="text-destructive">*</span>
          </label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Email <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Student Groups <span className="text-destructive">*</span>
          </label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
            multiple
            value={selectedGroups.map(String)}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
              setSelectedGroups(selected);
            }}
            required
            style={{ minHeight: '120px' }}
          >
            {studentGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.course_name} - {group.year})
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Hold Ctrl/Cmd to select multiple groups
          </p>
          {selectedGroups.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected: {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

