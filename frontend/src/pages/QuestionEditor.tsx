import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import {
  QuestionDetail,
  Option,
  fetchQuestion,
  updateQuestion,
  createOption,
  updateOption,
  deleteOption,
} from "@/lib/api";
import { QuestionPreview } from "@/components/QuestionPreview";

interface EditableOption extends Omit<Option, 'id' | 'created_at' | 'updated_at'> {
  id: number | 'new';
  isNew?: boolean;
}

export default function QuestionEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreate = id === "new" || !id;

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [text, setText] = useState("");
  const [options, setOptions] = useState<EditableOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store initial values for change detection
  const initialValues = useRef<{
    text: string;
    options: EditableOption[];
  }>({
    text: "",
    options: [],
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isSavingRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (isCreate) {
        setError("Creating new questions is not yet supported. Please edit existing questions.");
        return;
      }

      try {
        const q = await fetchQuestion(Number(id));
        setQuestion(q);
        setText(q.text);
        const opts = (q.options || []).map(opt => ({ ...opt }));
        setOptions(opts);
        initialValues.current = {
          text: q.text,
          options: opts.map(opt => ({ ...opt })),
        };
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load question");
      }
    };
    init();
  }, [id, isCreate]);

  // Check for unsaved changes
  useEffect(() => {
    if (!question) return;

    const textChanged = text.trim() !== initialValues.current.text.trim();
    const optionsChanged =
      options.length !== initialValues.current.options.length ||
      options.some((opt, idx) => {
        const initOpt = initialValues.current.options[idx];
        if (!initOpt) return true;
        return (
          opt.text.trim() !== initOpt.text.trim() ||
          opt.is_correct !== initOpt.is_correct
        );
      }) ||
      initialValues.current.options.some((initOpt, idx) => {
        const opt = options[idx];
        if (!opt) return true;
        return (
          opt.text.trim() !== initOpt.text.trim() ||
          opt.is_correct !== initOpt.is_correct
        );
      });

    setHasUnsavedChanges(textChanged || optionsChanged);
  }, [text, options, question]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      window.onbeforeunload = () => {
        return true;
      };
    } else {
      window.onbeforeunload = null;
    }

    return () => {
      window.onbeforeunload = null;
    };
  }, [hasUnsavedChanges]);

  // Block React Router navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && !isSavingRef.current && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  const handleBack = () => {
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
      return;
    }
    if (question) {
      navigate(`/questions/${question.id}`);
    } else {
      navigate("/questions");
    }
  };

  const handleAddOption = () => {
    if (!question) return;
    const newOption: EditableOption = {
      id: 'new',
      text: "",
      is_correct: false,
      organization: question.organization,
      question: question.id,
      isNew: true,
    };
    setOptions([...options, newOption]);
  };

  const handleRemoveOption = (optionId: number | 'new') => {
    setOptions(options.filter(opt => opt.id !== optionId));
  };

  const handleUpdateOption = (optionId: number | 'new', field: 'text' | 'is_correct', value: string | boolean) => {
    setOptions(options.map(opt =>
      opt.id === optionId ? { ...opt, [field]: value } : opt
    ));
  };

  const handleSave = async () => {
    if (!question || !user) return;

    setSaving(true);
    isSavingRef.current = true;
    setError(null);

    try {
      // Validate required fields
      if (!text.trim()) {
        setError("Question text is required");
        setSaving(false);
        isSavingRef.current = false;
        return;
      }

      if (options.length === 0) {
        setError("At least one option is required");
        setSaving(false);
        isSavingRef.current = false;
        return;
      }

      const hasCorrect = options.some(opt => opt.is_correct);
      if (!hasCorrect) {
        setError("At least one option must be marked as correct");
        setSaving(false);
        isSavingRef.current = false;
        return;
      }

      // Update question text
      await updateQuestion(question.id, { text: text.trim() });

      // Handle options: create new, update existing, delete removed
      const currentOptionIds = new Set(options.map(opt => typeof opt.id === 'number' ? opt.id : null).filter(Boolean) as number[]);
      const initialOptionIds = new Set(initialValues.current.options.map(opt => opt.id).filter((id): id is number => typeof id === 'number'));

      // Delete removed options
      const toDelete = Array.from(initialOptionIds).filter(id => !currentOptionIds.has(id));
      for (const optId of toDelete) {
        await deleteOption(optId);
      }

      // Create new options and update existing ones
      for (const opt of options) {
        if (opt.id === 'new' || opt.isNew) {
          // Create new option
          await createOption({
            text: opt.text.trim(),
            is_correct: opt.is_correct,
            organization: user.organization.id,
            question: question.id,
          });
        } else if (typeof opt.id === 'number') {
          // Update existing option
          const initOpt = initialValues.current.options.find(o => o.id === opt.id);
          if (!initOpt) continue;

          const changed = opt.text.trim() !== initOpt.text.trim() || opt.is_correct !== initOpt.is_correct;
          if (changed) {
            await updateOption(opt.id, {
              text: opt.text.trim(),
              is_correct: opt.is_correct,
            });
          }
        }
      }

      // Reload question to get updated data
      const updatedQuestion = await fetchQuestion(question.id);
      setQuestion(updatedQuestion);
      setText(updatedQuestion.text);
      const updatedOpts = (updatedQuestion.options || []).map(opt => ({ ...opt }));
      setOptions(updatedOpts);
      initialValues.current = {
        text: updatedQuestion.text,
        options: updatedOpts.map(opt => ({ ...opt })),
      };

      setHasUnsavedChanges(false);
      navigate(`/questions/${question.id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save question");
    } finally {
      setSaving(false);
      setTimeout(() => {
        isSavingRef.current = false;
      }, 100);
    }
  };

  // Create a QuestionDetail-like object for preview
  const previewQuestion: QuestionDetail | null = question ? {
    ...question,
    text,
    options: options.map(opt => ({
      id: typeof opt.id === 'number' ? opt.id : 0,
      text: opt.text,
      is_correct: opt.is_correct,
      organization: opt.organization,
      question: opt.question,
      created_at: typeof opt.id === 'number' ? (question.options?.find(o => o.id === opt.id)?.created_at || '') : '',
      updated_at: typeof opt.id === 'number' ? (question.options?.find(o => o.id === opt.id)?.updated_at || '') : '',
    })),
  } : null;

  if (error && !question) {
    return (
      <>
        <PageHeader>
          <PageHeaderHeading>Edit Question</PageHeaderHeading>
        </PageHeader>
        <div className="flex items-center justify-center p-8">
          <p className="text-destructive">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Edit Question</PageHeaderHeading>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>Back</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            variant={!hasUnsavedChanges ? "secondary" : "default"}
          >
            {saving ? "Saving..." : (hasUnsavedChanges ? "Save" : "Changes saved")}
          </Button>
        </div>
      </PageHeader>

      {error ? (
        <div className="text-destructive mb-4">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-md border p-4">
            <label className="block text-sm font-medium mb-2">
              Question Text <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter question text"
              required
            />
          </div>

          <div className="rounded-md border">
            <div className="flex items-center justify-between border-b p-3">
              <div className="text-sm font-medium">Options</div>
              <Button size="sm" onClick={handleAddOption} disabled={!question}>
                Add Option
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Option Text</TableHead>
                    <TableHead className="w-24">Correct</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.length > 0 ? (
                    options.map((option) => (
                      <TableRow key={option.id === 'new' ? `new-${options.indexOf(option)}` : option.id}>
                        <TableCell>
                          <input
                            className="w-full rounded-md border px-2 py-1 text-sm"
                            value={option.text}
                            onChange={(e) => handleUpdateOption(option.id, 'text', e.target.value)}
                            placeholder="Enter option text"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={option.is_correct}
                            onChange={(e) => handleUpdateOption(option.id, 'is_correct', e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveOption(option.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No options. Click "Add Option" to add one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div>
          <QuestionPreview question={previewQuestion} />
        </div>
      </div>
    </>
  );
}
