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
  MultipleChoiceQuestionDetail,
  OrderQuestionDetail,
  ConnectQuestionDetail,
  Option,
  OrderOption,
  ConnectOption,
  Course,
  Module,
  Lesson,
  Topic,
  fetchQuestion,
  createQuestion,
  updateQuestion,
  createOption,
  updateOption,
  deleteOption,
  createOrderOption,
  updateOrderOption,
  deleteOrderOption,
  createConnectOption,
  updateConnectOption,
  deleteConnectOption,
  createConnectOptionConnection,
  deleteConnectOptionConnection,
  fetchCourses,
  fetchModules,
  fetchLessons,
  fetchTopics,
} from "@/lib/api";
import { QuestionPreview } from "@/components/QuestionPreview";
import { QuestionTypeBadge } from "@/components/QuestionTypeBadge";
import { ChevronUpIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { ConnectQuestionLayoutEditor } from "@/components/ConnectQuestionLayoutEditor";

interface EditableOption extends Omit<Option, 'id' | 'created_at' | 'updated_at'> {
  id: number | string;
  isNew?: boolean;
}

interface EditableOrderOption extends Omit<OrderOption, 'id' | 'created_at' | 'updated_at'> {
  id: number | string;
  isNew?: boolean;
}

interface EditableConnectOption extends Omit<ConnectOption, 'id' | 'created_at' | 'updated_at'> {
  id: number | string;
  isNew?: boolean;
}

export default function QuestionEditor() {
  const { id, type } = useParams<{ id: string; type?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreate = id === "new" || !id;

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'order' | 'connect'>('multiple_choice');
  const [text, setText] = useState("");
  const [options, setOptions] = useState<EditableOption[]>([]);
  const [orderOptions, setOrderOptions] = useState<EditableOrderOption[]>([]);
  const [connectOptions, setConnectOptions] = useState<EditableConnectOption[]>([]);
  const [connectConnections, setConnectConnections] = useState<Array<[number, number]>>([]);
  const [layoutEditorOpen, setLayoutEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Course/Module/Lesson/Topic selection
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  // Store initial values for change detection
  const initialValues = useRef<{
    text: string;
    topic: number | null;
    options: EditableOption[];
    orderOptions?: EditableOrderOption[];
  }>({
    text: "",
    topic: null,
    options: [],
    orderOptions: [],
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isSavingRef = useRef(false);
  const newOptionCounterRef = useRef(0);

  useEffect(() => {
    const init = async () => {
      try {
        const [cs] = await Promise.all([
          fetchCourses(),
        ]);
        setCourses(cs);

        if (isCreate) {
          // Initialize empty state for new question
          setText("");
          setQuestionType('multiple_choice');
          setOptions([]);
          setOrderOptions([]);
          setConnectOptions([]);
          setConnectConnections([]);
          initialValues.current = {
            text: "",
            topic: null,
            options: [],
          };
        } else {
          // Load existing question
          // Convert URL type path to question type
          const questionType = type === 'multiple-choice' 
            ? 'multiple_choice' as const
            : type === 'order' 
            ? 'order' as const
            : type === 'connect'
            ? 'connect' as const
            : undefined;
          const q = await fetchQuestion(Number(id), questionType);
          setQuestion(q);
          setQuestionType(q.question_type);
          setText(q.text);
          setSelectedTopic(q.topic);
          
          if (q.question_type === 'multiple_choice') {
            const opts = ((q as MultipleChoiceQuestionDetail).options || []).map(opt => ({ ...opt }));
            setOptions(opts);
            initialValues.current = {
              text: q.text,
              topic: q.topic,
              options: opts.map(opt => ({ ...opt })),
            };
          } else if (q.question_type === 'order') {
            const opts = ((q as OrderQuestionDetail).order_options || [])
              .map(opt => ({ ...opt }))
              .sort((a, b) => a.correct_order - b.correct_order);
            setOrderOptions(opts);
            initialValues.current = {
              text: q.text,
              topic: q.topic,
              options: [],
              orderOptions: opts.map(opt => ({ ...opt })),
            };
          } else if (q.question_type === 'connect') {
            const opts = ((q as ConnectQuestionDetail).connect_options || []).map(opt => ({ ...opt }));
            setConnectOptions(opts);
            const conns = ((q as ConnectQuestionDetail).correct_connections || []).map(conn => [conn.from_option, conn.to_option] as [number, number]);
            setConnectConnections(conns);
            initialValues.current = {
              text: q.text,
              topic: q.topic,
              options: [],
            };
          }

          // Load course/module/lesson based on question's topic
          // Fetch all topics and find the matching one to get lesson ID
          const allTopics = await fetchTopics();
          const topic = allTopics.find(t => t.id === q.topic);
          if (topic) {
            setSelectedLesson(topic.lesson);
            // Fetch all lessons to find the matching lesson
            const allLessons = await fetchLessons();
            const lesson = allLessons.find(l => l.id === topic.lesson);
            if (lesson) {
              setSelectedModule(lesson.module);
              // Fetch all modules to find the matching module
              const allModules = await fetchModules();
              const mod = allModules.find(m => m.id === lesson.module);
              if (mod) {
                setSelectedCourse(mod.course);
              }
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load question");
      }
    };
    init();
  }, [id, isCreate]);

  // Fetch modules when course changes
  useEffect(() => {
    const loadModules = async () => {
      if (selectedCourse) {
        try {
          const mods = await fetchModules(selectedCourse);
          setModules(mods);
          // Reset module/lesson/topic if they're not in the new list
          setSelectedModule((current) => {
            if (current && !mods.some(m => m.id === current)) {
              return null;
            }
            return current;
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to load modules");
        }
      } else {
        setModules([]);
        setSelectedModule(null);
      }
    };
    loadModules();
  }, [selectedCourse]);

  // Fetch lessons when module changes
  useEffect(() => {
    const loadLessons = async () => {
      if (selectedModule) {
        try {
          const less = await fetchLessons(selectedModule);
          setLessons(less);
          // Reset lesson/topic if they're not in the new list
          setSelectedLesson((current) => {
            if (current && !less.some(l => l.id === current)) {
              return null;
            }
            return current;
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to load lessons");
        }
      } else {
        setLessons([]);
        setSelectedLesson(null);
      }
    };
    loadLessons();
  }, [selectedModule]);

  // Fetch topics when lesson changes
  useEffect(() => {
    const loadTopics = async () => {
      if (selectedLesson) {
        try {
          const tops = await fetchTopics(selectedLesson);
          setTopics(tops);
          // Reset topic if it's not in the new list
          setSelectedTopic((current) => {
            if (current && !tops.some(t => t.id === current)) {
              return null;
            }
            return current;
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to load topics");
        }
      } else {
        setTopics([]);
        setSelectedTopic(null);
      }
    };
    loadTopics();
  }, [selectedLesson]);

  // Check for unsaved changes
  useEffect(() => {
    const textChanged = text.trim() !== initialValues.current.text.trim();
    const topicChanged = selectedTopic !== initialValues.current.topic;
    
    let optionsChanged = false;
    if (questionType === 'multiple_choice') {
      optionsChanged =
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
    } else if (questionType === 'order') {
      // For order questions, check if order options changed
      // Sort both arrays by correct_order for comparison
      const initialOrderOptions = (initialValues.current.orderOptions || [])
        .sort((a, b) => a.correct_order - b.correct_order);
      const currentOrderOptions = [...orderOptions]
        .sort((a, b) => a.correct_order - b.correct_order);
      
      optionsChanged = 
        currentOrderOptions.length !== initialOrderOptions.length ||
        currentOrderOptions.some((opt, idx) => {
          const initOpt = initialOrderOptions[idx];
          if (!initOpt) return true;
          return (
            opt.text.trim() !== initOpt.text.trim() ||
            opt.correct_order !== initOpt.correct_order
          );
        }) ||
        initialOrderOptions.some((initOpt, idx) => {
          const opt = currentOrderOptions[idx];
          if (!opt) return true;
          return (
            opt.text.trim() !== initOpt.text.trim() ||
            opt.correct_order !== initOpt.correct_order
          );
        });
    }

    setHasUnsavedChanges(textChanged || topicChanged || optionsChanged);
  }, [text, selectedTopic, options, orderOptions, questionType, question]);

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
      const typePath = question.question_type === 'multiple_choice' 
        ? 'multiple-choice' 
        : question.question_type === 'order'
        ? 'order'
        : 'connect';
      navigate(`/questions/${typePath}/${question.id}`);
    } else {
      navigate("/questions");
    }
  };

  const handleAddOption = () => {
    if (!user) return;
    const uniqueId = `new-${Date.now()}-${newOptionCounterRef.current++}`;
    const newOption: EditableOption = {
      id: uniqueId,
      text: "",
      is_correct: false,
      organization: user.organization.id,
      question: question?.id || 0,
      isNew: true,
    };
    setOptions([...options, newOption]);
  };

  const handleRemoveOption = (optionId: number | string) => {
    setOptions(options.filter(opt => opt.id !== optionId));
  };

  const handleUpdateOption = (optionId: number | string, field: 'text' | 'is_correct', value: string | boolean) => {
    setOptions(options.map(opt =>
      opt.id === optionId ? { ...opt, [field]: value } : opt
    ));
  };

  // Order question handlers
  const handleAddOrderOption = () => {
    if (!user) return;
    const uniqueId = `new-${Date.now()}-${newOptionCounterRef.current++}`;
    const currentMaxOrder = orderOptions.length > 0 
      ? Math.max(...orderOptions.map(opt => opt.correct_order))
      : 0;
    const newOption: EditableOrderOption = {
      id: uniqueId,
      text: "",
      correct_order: currentMaxOrder + 1,
      organization: user.organization.id,
      question: question?.id || 0,
      isNew: true,
    };
    setOrderOptions([...orderOptions, newOption]);
  };

  const handleRemoveOrderOption = (optionId: number | string) => {
    const removed = orderOptions.find(opt => opt.id === optionId);
    const updated = orderOptions.filter(opt => opt.id !== optionId);
    // Reorder remaining options
    const reordered = updated.map((opt, idx) => ({
      ...opt,
      correct_order: idx + 1,
    }));
    setOrderOptions(reordered);
  };

  const handleUpdateOrderOption = (optionId: number | string, field: 'text' | 'correct_order', value: string | number) => {
    setOrderOptions(orderOptions.map(opt =>
      opt.id === optionId ? { ...opt, [field]: value } : opt
    ));
  };

  const handleMoveOrderOption = (optionId: number | string, direction: 'up' | 'down') => {
    const currentIndex = orderOptions.findIndex(opt => opt.id === optionId);
    if (currentIndex === -1) return;
    
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === orderOptions.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const updated = [...orderOptions];
    [updated[currentIndex], updated[newIndex]] = [updated[newIndex], updated[currentIndex]];
    
    // Update correct_order values
    const reordered = updated.map((opt, idx) => ({
      ...opt,
      correct_order: idx + 1,
    }));
    setOrderOptions(reordered);
  };

  // Connect question handlers
  const handleAddConnectOption = () => {
    if (!user) return;
    const uniqueId = `new-${Date.now()}-${newOptionCounterRef.current++}`;
    const newOption: EditableConnectOption = {
      id: uniqueId,
      text: "",
      position_x: 0.5,
      position_y: 0.5,
      organization: user.organization.id,
      question: question?.id || 0,
      isNew: true,
    };
    setConnectOptions([...connectOptions, newOption]);
  };

  const handleRemoveConnectOption = (optionId: number | string) => {
    // Remove option and all connections involving it
    setConnectOptions(connectOptions.filter(opt => opt.id !== optionId));
    setConnectConnections(
      connectConnections.filter(([from, to]) => from !== optionId && to !== optionId)
    );
  };

  const handleUpdateConnectOption = (optionId: number | string, field: 'text', value: string) => {
    setConnectOptions(connectOptions.map(opt =>
      opt.id === optionId ? { ...opt, [field]: value } : opt
    ));
  };

  const handleSave = async () => {
    if (!user) return;

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

      if (!selectedTopic) {
        setError("Topic is required");
        setSaving(false);
        isSavingRef.current = false;
        return;
      }

      // Validate based on question type
      if (questionType === 'multiple_choice') {
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
      } else if (questionType === 'order') {
        if (orderOptions.length === 0) {
          setError("At least one order option is required");
          setSaving(false);
          isSavingRef.current = false;
          return;
        }
      } else if (questionType === 'connect') {
        if (connectOptions.length === 0) {
          setError("At least one connect option is required");
          setSaving(false);
          isSavingRef.current = false;
          return;
        }
      }

      let questionId: number;

      if (isCreate) {
        // Create new question
        const created = await createQuestion({
          text: text.trim(),
          question_type: questionType,
          organization: user.organization.id,
          topic: selectedTopic,
          learning_objectives: [],
        });
        questionId = created.id;
        
        // Create options based on question type
        if (questionType === 'multiple_choice') {
          for (const opt of options) {
            await createOption({
              text: opt.text.trim(),
              is_correct: opt.is_correct,
              organization: user.organization.id,
              question: questionId,
            });
          }
        } else if (questionType === 'order') {
          for (const opt of orderOptions) {
            await createOrderOption({
              text: opt.text.trim(),
              correct_order: opt.correct_order,
              organization: user.organization.id,
              question: questionId,
            });
          }
        } else if (questionType === 'connect') {
          const createdOptionIds: number[] = [];
          for (const opt of connectOptions) {
            const created = await createConnectOption({
              text: opt.text.trim(),
              position_x: opt.position_x,
              position_y: opt.position_y,
              organization: user.organization.id,
              question: questionId,
            });
            createdOptionIds.push(created.id);
          }
          // Create connections (connectConnections contains [from_option_id, to_option_id] pairs)
          for (const [fromId, toId] of connectConnections) {
            // Map temporary IDs to created IDs if needed
            const actualFromId = typeof fromId === 'number' && fromId < 1000 
              ? createdOptionIds[fromId] || fromId
              : fromId;
            const actualToId = typeof toId === 'number' && toId < 1000
              ? createdOptionIds[toId] || toId
              : toId;
            if (actualFromId && actualToId) {
              await createConnectOptionConnection({
                question: questionId,
                from_option: actualFromId,
                to_option: actualToId,
                organization: user.organization.id,
              });
            }
          }
        }

        // Reload question to get full data
        const createdQuestion = await fetchQuestion(questionId);
        setQuestion(createdQuestion);
        setQuestionType(createdQuestion.question_type);
        setText(createdQuestion.text);
        setSelectedTopic(createdQuestion.topic);
        
        // Load options based on question type
        if (createdQuestion.question_type === 'multiple_choice') {
          const opts = ((createdQuestion as MultipleChoiceQuestionDetail).options || []).map(opt => ({ ...opt }));
          setOptions(opts);
          initialValues.current = {
            text: createdQuestion.text,
            topic: createdQuestion.topic,
            options: opts.map(opt => ({ ...opt })),
          };
        } else if (createdQuestion.question_type === 'order') {
          const opts = ((createdQuestion as OrderQuestionDetail).order_options || [])
            .map(opt => ({ ...opt }))
            .sort((a, b) => a.correct_order - b.correct_order);
          setOrderOptions(opts);
          initialValues.current = {
            text: createdQuestion.text,
            topic: createdQuestion.topic,
            options: [],
            orderOptions: opts.map(opt => ({ ...opt })),
          };
        } else if (createdQuestion.question_type === 'connect') {
          const opts = ((createdQuestion as ConnectQuestionDetail).connect_options || []).map(opt => ({ ...opt }));
          setConnectOptions(opts);
          const conns = ((createdQuestion as ConnectQuestionDetail).correct_connections || []).map(conn => [conn.from_option, conn.to_option] as [number, number]);
          setConnectConnections(conns);
          initialValues.current = {
            text: createdQuestion.text,
            topic: createdQuestion.topic,
            options: [],
          };
        }
        
        setHasUnsavedChanges(false);
        // Determine type path from the created question
        const typePath = createdQuestion.question_type === 'multiple_choice' 
          ? 'multiple-choice' 
          : createdQuestion.question_type === 'order'
          ? 'order'
          : 'connect';
        navigate(`/questions/${typePath}/${questionId}/edit`, { replace: true });
      } else if (question) {
        // Update existing question
        await updateQuestion(question.id, { 
          text: text.trim(),
          topic: selectedTopic,
        }, question.question_type);

        // Handle options based on question type
        if (question.question_type === 'multiple_choice') {
          // Handle options: create new, update existing, delete removed
          const currentOptionIds = new Set(options.map(opt => typeof opt.id === 'number' ? opt.id : null).filter((id): id is number => id !== null));
          const initialOptionIds = new Set(initialValues.current.options.map(opt => opt.id).filter((id): id is number => typeof id === 'number'));

          // Delete removed options
          const toDelete = Array.from(initialOptionIds).filter(id => !currentOptionIds.has(id));
          for (const optId of toDelete) {
            await deleteOption(optId);
          }

          // Create new options and update existing ones
          for (const opt of options) {
            if (typeof opt.id === 'string' || opt.isNew) {
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
        } else if (question.question_type === 'order') {
          // Handle order options: create new, update existing, delete removed
          const currentOptionIds = new Set(orderOptions.map(opt => typeof opt.id === 'number' ? opt.id : null).filter((id): id is number => id !== null));
          const initialOrderOptions = (question as OrderQuestionDetail).order_options || [];
          const initialOptionIds = new Set(initialOrderOptions.map(opt => opt.id));

          // Delete removed options
          const toDelete = Array.from(initialOptionIds).filter(id => !currentOptionIds.has(id));
          for (const optId of toDelete) {
            await deleteOrderOption(optId);
          }

          // Create new options and update existing ones
          for (const opt of orderOptions) {
            if (typeof opt.id === 'string' || opt.isNew) {
              // Create new option
              await createOrderOption({
                text: opt.text.trim(),
                correct_order: opt.correct_order,
                organization: user.organization.id,
                question: question.id,
              });
            } else if (typeof opt.id === 'number') {
              // Update existing option
              const initOpt = initialOrderOptions.find(o => o.id === opt.id);
              if (!initOpt) continue;

              const changed = opt.text.trim() !== initOpt.text.trim() || opt.correct_order !== initOpt.correct_order;
              if (changed) {
                await updateOrderOption(opt.id, {
                  text: opt.text.trim(),
                  correct_order: opt.correct_order,
                });
              }
            }
          }
        } else if (question.question_type === 'connect') {
          // Handle connect options: create new, update existing, delete removed
          const currentOptionIds = new Set(connectOptions.map(opt => typeof opt.id === 'number' ? opt.id : null).filter((id): id is number => id !== null));
          const initialConnectOptions = (question as ConnectQuestionDetail).connect_options || [];
          const initialOptionIds = new Set(initialConnectOptions.map(opt => opt.id));

          // Delete removed options
          const toDelete = Array.from(initialOptionIds).filter(id => !currentOptionIds.has(id));
          for (const optId of toDelete) {
            await deleteConnectOption(optId);
            // Also delete connections involving this option
            const connectionsToDelete = connectConnections.filter(([from, to]) => from === optId || to === optId);
            for (const [from, to] of connectionsToDelete) {
              // Find the connection ID from the question's correct_connections
              const conn = (question as ConnectQuestionDetail).correct_connections?.find(
                c => (c.from_option === from && c.to_option === to) || (c.from_option === to && c.to_option === from)
              );
              if (conn) {
                await deleteConnectOptionConnection(conn.id);
              }
            }
          }

          // Create new options and update existing ones
          const createdOptionIdMap = new Map<number | string, number>();
          for (const opt of connectOptions) {
            if (typeof opt.id === 'string' || opt.isNew) {
              // Create new option
              const created = await createConnectOption({
                text: opt.text.trim(),
                position_x: opt.position_x,
                position_y: opt.position_y,
                organization: user.organization.id,
                question: question.id,
              });
              createdOptionIdMap.set(opt.id, created.id);
            } else if (typeof opt.id === 'number') {
              // Update existing option
              const initOpt = initialConnectOptions.find(o => o.id === opt.id);
              if (!initOpt) continue;

              const changed = opt.text.trim() !== initOpt.text.trim() || 
                            opt.position_x !== initOpt.position_x || 
                            opt.position_y !== initOpt.position_y;
              if (changed) {
                await updateConnectOption(opt.id, {
                  text: opt.text.trim(),
                  position_x: opt.position_x,
                  position_y: opt.position_y,
                });
              }
              createdOptionIdMap.set(opt.id, opt.id);
            }
          }

          // Handle connections: delete old ones, create new ones
          const initialConnections = (question as ConnectQuestionDetail).correct_connections || [];
          const currentConnectionPairs = new Set(
            connectConnections.map(([from, to]) => {
              const fromId = createdOptionIdMap.get(from) || from;
              const toId = createdOptionIdMap.get(to) || to;
              return `${Math.min(fromId as number, toId as number)}-${Math.max(fromId as number, toId as number)}`;
            })
          );

          // Delete removed connections
          for (const conn of initialConnections) {
            const pairKey = `${Math.min(conn.from_option, conn.to_option)}-${Math.max(conn.from_option, conn.to_option)}`;
            if (!currentConnectionPairs.has(pairKey)) {
              await deleteConnectOptionConnection(conn.id);
            }
          }

          // Create new connections
          const existingConnectionPairs = new Set(
            initialConnections.map(conn => 
              `${Math.min(conn.from_option, conn.to_option)}-${Math.max(conn.from_option, conn.to_option)}`
            )
          );

          for (const [from, to] of connectConnections) {
            const actualFromId = createdOptionIdMap.get(from) || from;
            const actualToId = createdOptionIdMap.get(to) || to;
            const pairKey = `${Math.min(actualFromId as number, actualToId as number)}-${Math.max(actualFromId as number, actualToId as number)}`;
            
            if (!existingConnectionPairs.has(pairKey)) {
              await createConnectOptionConnection({
                question: question.id,
                from_option: actualFromId as number,
                to_option: actualToId as number,
                organization: user.organization.id,
              });
            }
          }
        }

        // Reload question to get updated data
        const updatedQuestion = await fetchQuestion(question.id);
        setQuestion(updatedQuestion);
        setQuestionType(updatedQuestion.question_type);
        setText(updatedQuestion.text);
        setSelectedTopic(updatedQuestion.topic);
        
        // Load options based on question type
        if (updatedQuestion.question_type === 'multiple_choice') {
          const opts = ((updatedQuestion as MultipleChoiceQuestionDetail).options || []).map(opt => ({ ...opt }));
          setOptions(opts);
          initialValues.current = {
            text: updatedQuestion.text,
            topic: updatedQuestion.topic,
            options: opts.map(opt => ({ ...opt })),
          };
        } else if (updatedQuestion.question_type === 'order') {
          const opts = ((updatedQuestion as OrderQuestionDetail).order_options || [])
            .map(opt => ({ ...opt }))
            .sort((a, b) => a.correct_order - b.correct_order);
          setOrderOptions(opts);
          initialValues.current = {
            text: updatedQuestion.text,
            topic: updatedQuestion.topic,
            options: [],
            orderOptions: opts.map(opt => ({ ...opt })),
          };
        } else if (updatedQuestion.question_type === 'connect') {
          const opts = ((updatedQuestion as ConnectQuestionDetail).connect_options || []).map(opt => ({ ...opt }));
          setConnectOptions(opts);
          const conns = ((updatedQuestion as ConnectQuestionDetail).correct_connections || []).map(conn => [conn.from_option, conn.to_option] as [number, number]);
          setConnectConnections(conns);
          initialValues.current = {
            text: updatedQuestion.text,
            topic: updatedQuestion.topic,
            options: [],
          };
        }
        
        setHasUnsavedChanges(false);
        const typePath = updatedQuestion.question_type === 'multiple_choice' 
          ? 'multiple-choice' 
          : updatedQuestion.question_type === 'order'
          ? 'order'
          : 'connect';
        navigate(`/questions/${typePath}/${question.id}/edit`, { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save question");
    } finally {
      setSaving(false);
      setTimeout(() => {
        isSavingRef.current = false;
      }, 100);
    }
  };

  const setInitialQuestionData = (q: QuestionDetail) => {
    const opts = (q.options || []).map(opt => ({ ...opt }));
    // Update all state in one go to prevent double rendering
    setText(q.text);
    setSelectedTopic(q.topic);
    setOptions(opts);
    initialValues.current = {
      text: q.text,
      topic: q.topic,
      options: opts.map(opt => ({ ...opt })),
    };
  };

  // Create a QuestionDetail-like object for preview
  const previewQuestion: QuestionDetail | null = (question || (isCreate && text && selectedTopic)) ? (
    questionType === 'multiple_choice' ? {
      id: question?.id || 0,
      text: text || "",
      order: question?.order || 0,
      question_type: 'multiple_choice' as const,
      image: question?.image || null,
      video: question?.video || null,
      organization: user?.organization.id || 0,
      quiz: question?.quiz || null,
      topic: selectedTopic || 0,
      learning_objectives: [],
      topic_name: topics.find(t => t.id === selectedTopic)?.name || "",
      lesson_name: lessons.find(l => l.id === selectedLesson)?.name || "",
      module_name: modules.find(m => m.id === selectedModule)?.name || "",
      course_name: courses.find(c => c.id === selectedCourse)?.name || "",
      quiz_name: null,
      options_count: options.length,
      learning_objectives_count: 0,
      created_at: question?.created_at || "",
      updated_at: question?.updated_at || "",
      options: options.map(opt => ({
        id: typeof opt.id === 'number' ? opt.id : 0,
        text: opt.text,
        is_correct: opt.is_correct,
        image: opt.image || null,
        organization: opt.organization,
        question: opt.question,
        created_at: typeof opt.id === 'number' ? ((question as MultipleChoiceQuestionDetail)?.options?.find(o => o.id === opt.id)?.created_at || '') : '',
        updated_at: typeof opt.id === 'number' ? ((question as MultipleChoiceQuestionDetail)?.options?.find(o => o.id === opt.id)?.updated_at || '') : '',
      })),
    } : questionType === 'order' ? {
      id: question?.id || 0,
      text: text || "",
      order: question?.order || 0,
      question_type: 'order' as const,
      image: question?.image || null,
      video: question?.video || null,
      organization: user?.organization.id || 0,
      quiz: question?.quiz || null,
      topic: selectedTopic || 0,
      learning_objectives: [],
      topic_name: topics.find(t => t.id === selectedTopic)?.name || "",
      lesson_name: lessons.find(l => l.id === selectedLesson)?.name || "",
      module_name: modules.find(m => m.id === selectedModule)?.name || "",
      course_name: courses.find(c => c.id === selectedCourse)?.name || "",
      quiz_name: null,
      order_options_count: orderOptions.length,
      learning_objectives_count: 0,
      created_at: question?.created_at || "",
      updated_at: question?.updated_at || "",
      order_options: (() => {
        // Create a map of original IDs to new IDs for new options
        const idMap = new Map<string | number, number>();
        let tempIdCounter = 1000;
        
        orderOptions.forEach(opt => {
          if (typeof opt.id === 'string') {
            // Generate a stable negative ID for string IDs
            if (!idMap.has(opt.id)) {
              idMap.set(opt.id, -tempIdCounter++);
            }
          }
        });
        
        return orderOptions
          .sort((a, b) => a.correct_order - b.correct_order)
          .map((opt) => ({
            // Use existing ID for saved options, or mapped ID for new options
            id: typeof opt.id === 'number' ? opt.id : (idMap.get(opt.id) || -9999),
            text: opt.text,
            image: opt.image || null,
            correct_order: opt.correct_order,
            organization: opt.organization,
            question: opt.question,
            created_at: typeof opt.id === 'number' ? ((question as OrderQuestionDetail)?.order_options?.find(o => o.id === opt.id)?.created_at || '') : '',
            updated_at: typeof opt.id === 'number' ? ((question as OrderQuestionDetail)?.order_options?.find(o => o.id === opt.id)?.updated_at || '') : '',
          }));
      })(),
    } : {
      id: question?.id || 0,
      text: text || "",
      order: question?.order || 0,
      question_type: 'connect' as const,
      image: question?.image || null,
      video: question?.video || null,
      organization: user?.organization.id || 0,
      quiz: question?.quiz || null,
      topic: selectedTopic || 0,
      learning_objectives: [],
      topic_name: topics.find(t => t.id === selectedTopic)?.name || "",
      lesson_name: lessons.find(l => l.id === selectedLesson)?.name || "",
      module_name: modules.find(m => m.id === selectedModule)?.name || "",
      course_name: courses.find(c => c.id === selectedCourse)?.name || "",
      quiz_name: null,
      connect_options_count: connectOptions.length,
      connections_count: connectConnections.length,
      learning_objectives_count: 0,
      created_at: question?.created_at || "",
      updated_at: question?.updated_at || "",
      connect_options: connectOptions.map(opt => ({
        id: typeof opt.id === 'number' ? opt.id : 0,
        text: opt.text,
        image: opt.image || null,
        position_x: opt.position_x,
        position_y: opt.position_y,
        organization: opt.organization,
        question: opt.question,
        created_at: typeof opt.id === 'number' ? ((question as ConnectQuestionDetail)?.connect_options?.find(o => o.id === opt.id)?.created_at || '') : '',
        updated_at: typeof opt.id === 'number' ? ((question as ConnectQuestionDetail)?.connect_options?.find(o => o.id === opt.id)?.updated_at || '') : '',
      })),
      correct_connections: connectConnections.map(([from, to], idx) => ({
        id: idx,
        question: question?.id || 0,
        from_option: from,
        to_option: to,
        from_option_text: connectOptions.find(o => (typeof o.id === 'number' ? o.id : 0) === from)?.text || '',
        to_option_text: connectOptions.find(o => (typeof o.id === 'number' ? o.id : 0) === to)?.text || '',
        organization: user?.organization.id || 0,
        created_at: '',
        updated_at: '',
      })),
    }
  ) : null;

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{isCreate ? "Create Question" : "Edit Question"}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>Back</Button>
          <Button
            onClick={handleSave}
            disabled={saving || (!hasUnsavedChanges && !isCreate)}
            variant={!hasUnsavedChanges && !isCreate ? "secondary" : "default"}
          >
            {saving ? "Saving..." : (hasUnsavedChanges ? "Save" : (isCreate ? "Save" : "Changes saved"))}
          </Button>
        </div>
      </PageHeader>

      {error ? (
        <div className="text-destructive mb-4">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-md border p-4 space-y-4">
            {isCreate && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Question Type <span className="text-destructive">*</span>
                </label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={questionType}
                  onChange={(e) => {
                    const newType = e.target.value as 'multiple_choice' | 'order' | 'connect';
                    setQuestionType(newType);
                    // Pre-fill text for order questions
                    if (newType === 'order' && isCreate && !text.trim()) {
                      setText("Put the following items in the correct order:");
                    }
                  }}
                  disabled={!isCreate}
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="order">Order</option>
                  <option value="connect">Connect</option>
                </select>
                {!isCreate && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <QuestionTypeBadge questionType={questionType} />
                  </div>
                )}
              </div>
            )}
            {!isCreate && question && (
              <div>
                <label className="block text-sm font-medium mb-1">Question Type</label>
                <QuestionTypeBadge questionType={question.question_type} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Course</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={selectedCourse ?? ""}
                onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Select Course —</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Module</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                value={selectedModule ?? ""}
                onChange={(e) => setSelectedModule(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedCourse || modules.length === 0}
              >
                <option value="">— Select Module —</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lesson</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                value={selectedLesson ?? ""}
                onChange={(e) => setSelectedLesson(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedModule || lessons.length === 0}
              >
                <option value="">— Select Lesson —</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Topic <span className="text-destructive">*</span>
              </label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                value={selectedTopic ?? ""}
                onChange={(e) => setSelectedTopic(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedLesson || topics.length === 0}
                required
              >
                <option value="">— Select Topic —</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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

          {questionType === 'multiple_choice' && (
            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b p-3">
                <div className="text-sm font-medium">Options</div>
                <Button size="sm" onClick={handleAddOption}>
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
                        <TableRow key={typeof option.id === 'number' ? option.id : option.id}>
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
          )}
          
          {questionType === 'order' && (
            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b p-3">
                <div className="text-sm font-medium">Order Options</div>
                <Button size="sm" onClick={handleAddOrderOption}>
                  Add Option
                </Button>
              </div>
              <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Order</TableHead>
                      <TableHead>Option Text</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderOptions.length > 0 ? (
                      orderOptions
                        .sort((a, b) => a.correct_order - b.correct_order)
                        .map((option, idx) => (
                          <TableRow key={typeof option.id === 'number' ? option.id : option.id}>
                            <TableCell className="text-center font-medium">
                              {option.correct_order}
                            </TableCell>
                            <TableCell>
                              <input
                                className="w-full rounded-md border px-2 py-1 text-sm"
                                value={option.text}
                                onChange={(e) => handleUpdateOrderOption(option.id, 'text', e.target.value)}
                                placeholder="Enter option text"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMoveOrderOption(option.id, 'up')}
                                  disabled={idx === 0}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronUpIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMoveOrderOption(option.id, 'down')}
                                  disabled={idx === orderOptions.length - 1}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronDownIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveOrderOption(option.id)}
                                >
                                  Remove
                                </Button>
                              </div>
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
          )}
          
          {questionType === 'connect' && (
            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b p-3">
                <div className="text-sm font-medium">Connect Options</div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddConnectOption}>
                    Add Option
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setLayoutEditorOpen(true)}
                    disabled={connectOptions.length === 0}
                  >
                    Edit Layout
                  </Button>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Option Text</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectOptions.length > 0 ? (
                      connectOptions.map((option) => (
                        <TableRow key={typeof option.id === 'number' ? option.id : option.id}>
                          <TableCell>
                            <input
                              className="w-full rounded-md border px-2 py-1 text-sm"
                              value={option.text}
                              onChange={(e) => handleUpdateConnectOption(option.id, 'text', e.target.value)}
                              placeholder="Enter option text"
                            />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            ({option.position_x.toFixed(2)}, {option.position_y.toFixed(2)})
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveConnectOption(option.id)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No options. Click "Add Option" to add one, then use "Edit Layout" to position them and create connections.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {connectConnections.length > 0 && (
                <div className="border-t p-3 text-xs text-muted-foreground">
                  {connectConnections.length} connection(s) defined. Use "Edit Layout" to modify.
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <QuestionPreview question={previewQuestion} />
        </div>
      </div>

      {/* Connect Question Layout Editor Modal */}
      {questionType === 'connect' && (
        <ConnectQuestionLayoutEditor
          options={connectOptions}
          connections={connectConnections}
          onOptionsChange={setConnectOptions}
          onConnectionsChange={setConnectConnections}
          open={layoutEditorOpen}
          onOpenChange={setLayoutEditorOpen}
        />
      )}
    </>
  );
}