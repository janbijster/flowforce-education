import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  NumberQuestionDetail,
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
import { ImageUpload } from "@/components/ui/image-upload";
import { getLastCourse, setLastCourse, getLastModule, setLastModule, getLastLesson, setLastLesson, getLastTopic, setLastTopic } from "@/lib/utils";

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
  const { t } = useTranslation();
  const { id, type } = useParams<{ id: string; type?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreate = id === "new" || !id;

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'order' | 'connect' | 'number'>('multiple_choice');
  const [text, setText] = useState("");
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);
  const [questionHideText, setQuestionHideText] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [tolerance, setTolerance] = useState<number>(0);
  const [options, setOptions] = useState<EditableOption[]>([]);
  const [optionImageFiles, setOptionImageFiles] = useState<Map<number | string, File>>(new Map());
  const [orderOptions, setOrderOptions] = useState<EditableOrderOption[]>([]);
  const [orderOptionImageFiles, setOrderOptionImageFiles] = useState<Map<number | string, File>>(new Map());
  const [connectOptions, setConnectOptions] = useState<EditableConnectOption[]>([]);
  const [connectOptionImageFiles, setConnectOptionImageFiles] = useState<Map<number | string, File>>(new Map());
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
    image: string | null;
    hide_text: boolean;
    correct_answer?: number;
    tolerance?: number;
    options: EditableOption[];
    orderOptions?: EditableOrderOption[];
    connectOptions?: EditableConnectOption[];
    connectConnections?: Array<[number, number]>;
  }>({
    text: "",
    topic: null,
    image: null,
    hide_text: false,
    options: [],
    orderOptions: [],
    connectOptions: [],
    connectConnections: [],
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isSavingRef = useRef(false);
  const newOptionCounterRef = useRef(0);
  const isInitializingRef = useRef(false);
  const [previewKey, setPreviewKey] = useState(0); // Force refresh of preview after save

  useEffect(() => {
    const init = async () => {
      try {
        const [cs] = await Promise.all([
          fetchCourses(),
        ]);
        setCourses(cs);

        if (isCreate) {
          // Initialize empty state for new question
          isInitializingRef.current = true;
          setText("");
          setQuestionType('multiple_choice');
          setQuestionHideText(false);
          setCorrectAnswer(0);
          setTolerance(0);
          setOptions([]);
          setOrderOptions([]);
          setConnectOptions([]);
          setConnectConnections([]);
          
          // Prefill with last used selections
          const lastCourse = getLastCourse();
          const lastModule = getLastModule();
          const lastLesson = getLastLesson();
          const lastTopic = getLastTopic();
          
          if (lastCourse) {
            setSelectedCourse(lastCourse);
            // Load modules for the last course
            const mods = await fetchModules(lastCourse);
            setModules(mods);
            if (lastModule && mods.some(m => m.id === lastModule)) {
              setSelectedModule(lastModule);
              // Load lessons for the last module
              const less = await fetchLessons(lastModule);
              setLessons(less);
              if (lastLesson && less.some(l => l.id === lastLesson)) {
                setSelectedLesson(lastLesson);
                // Load topics for the last lesson
                const tops = await fetchTopics(lastLesson);
                setTopics(tops);
                if (lastTopic && tops.some(t => t.id === lastTopic)) {
                  setSelectedTopic(lastTopic);
                }
              }
            }
          }
          
          // Mark initialization as complete after a short delay to let useEffect hooks run
          setTimeout(() => {
            isInitializingRef.current = false;
          }, 100);
          
          initialValues.current = {
            text: "",
            topic: null,
            image: null,
            hide_text: false,
            options: [],
          };
        } else {
          isInitializingRef.current = false;
          // Load existing question
          // Convert URL type path to question type
          const questionType = type === 'multiple-choice' 
            ? 'multiple_choice' as const
            : type === 'order' 
            ? 'order' as const
            : type === 'connect'
            ? 'connect' as const
            : type === 'number'
            ? 'number' as const
            : undefined;
          const q = await fetchQuestion(Number(id), questionType);
          setQuestion(q);
          setQuestionType(q.question_type);
          setText(q.text);
          setSelectedTopic(q.topic);
          setQuestionHideText(q.hide_text || false);
          // Convert relative image URL to absolute if needed
          const imageUrl = q.image ? (q.image.startsWith('http') ? q.image : `http://127.0.0.1:8000${q.image}`) : null;
          setQuestionImage(imageUrl);
          setQuestionImageFile(null);
          
          if (q.question_type === 'number') {
            const numQ = q as NumberQuestionDetail;
            setCorrectAnswer(numQ.correct_answer || 0);
            setTolerance(numQ.tolerance || 0);
            initialValues.current = {
              text: q.text,
              topic: q.topic,
              image: imageUrl,
              hide_text: q.hide_text || false,
              options: [],
              correct_answer: numQ.correct_answer || 0,
              tolerance: numQ.tolerance || 0,
            };
          } else if (q.question_type === 'multiple_choice') {
            const opts = ((q as MultipleChoiceQuestionDetail).options || []).map(opt => ({ ...opt }));
          setOptions(opts);
          initialValues.current = {
            text: q.text,
            topic: q.topic,
            image: imageUrl,
            hide_text: q.hide_text || false,
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
              image: imageUrl,
              hide_text: q.hide_text || false,
              options: [],
              orderOptions: opts.map(opt => ({ ...opt })),
            };
          } else if (q.question_type === 'connect') {
            const opts = ((q as ConnectQuestionDetail).connect_options || []).map(opt => ({ 
              ...opt,
              width: opt.width || 100,
              height: opt.height || 60,
            }));
            setConnectOptions(opts);
            const conns = ((q as ConnectQuestionDetail).correct_connections || []).map(conn => [conn.from_option, conn.to_option] as [number, number]);
            setConnectConnections(conns);
            initialValues.current = {
              text: q.text,
              topic: q.topic,
              image: imageUrl,
              hide_text: q.hide_text || false,
              options: [],
              connectOptions: opts.map(opt => ({ ...opt })),
              connectConnections: conns.map(([from, to]) => [from, to] as [number, number]),
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
        setError(e instanceof Error ? e.message : t("questions.failedToLoadQuestion"));
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
          // Don't save to localStorage here - only save when question is saved
        } catch (e) {
          setError(e instanceof Error ? e.message : t("errors.failedToLoadModules"));
        }
      } else {
        setModules([]);
        setSelectedModule(null);
        // Don't clear localStorage here - only save when question is saved
      }
    };
    loadModules();
  }, [selectedCourse, isCreate]);

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
          // Don't save to localStorage here - only save when question is saved
        } catch (e) {
          setError(e instanceof Error ? e.message : t("errors.failedToLoadLessons"));
        }
      } else {
        setLessons([]);
        setSelectedLesson(null);
        // Don't clear localStorage here - only save when question is saved
      }
    };
    loadLessons();
  }, [selectedModule, isCreate]);

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
          // Don't save to localStorage here - only save when question is saved
        } catch (e) {
          setError(e instanceof Error ? e.message : t("errors.failedToLoadTopics"));
        }
      } else {
        setTopics([]);
        setSelectedTopic(null);
        // Don't clear localStorage here - only save when question is saved
      }
    };
    loadTopics();
  }, [selectedLesson, isCreate]);

  // Check for unsaved changes
  useEffect(() => {
    const textChanged = text.trim() !== initialValues.current.text.trim();
    const topicChanged = selectedTopic !== initialValues.current.topic;
    const imageChanged = questionImage !== initialValues.current.image || questionImageFile !== null;
    const hideTextChanged = questionHideText !== initialValues.current.hide_text;
    
    let optionsChanged = false;
    if (questionType === 'number') {
      const correctAnswerChanged = correctAnswer !== (initialValues.current.correct_answer ?? 0);
      const toleranceChanged = tolerance !== (initialValues.current.tolerance ?? 0);
      optionsChanged = correctAnswerChanged || toleranceChanged;
    } else if (questionType === 'multiple_choice') {
      optionsChanged =
        options.length !== initialValues.current.options.length ||
        options.some((opt, idx) => {
          const initOpt = initialValues.current.options[idx];
          if (!initOpt) return true;
            return (
              opt.text.trim() !== initOpt.text.trim() ||
              opt.is_correct !== initOpt.is_correct ||
              opt.image !== initOpt.image ||
              opt.hide_text !== initOpt.hide_text ||
              optionImageFiles.has(opt.id)
            );
          }) ||
          initialValues.current.options.some((initOpt, idx) => {
            const opt = options[idx];
            if (!opt) return true;
            return (
              opt.text.trim() !== initOpt.text.trim() ||
              opt.is_correct !== initOpt.is_correct ||
              opt.image !== initOpt.image ||
              opt.hide_text !== initOpt.hide_text ||
              optionImageFiles.has(opt.id)
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
            opt.correct_order !== initOpt.correct_order ||
            opt.image !== initOpt.image ||
            opt.hide_text !== initOpt.hide_text ||
            orderOptionImageFiles.has(opt.id)
          );
        }) ||
        initialOrderOptions.some((initOpt, idx) => {
          const opt = currentOrderOptions[idx];
          if (!opt) return true;
          return (
            opt.text.trim() !== initOpt.text.trim() ||
            opt.correct_order !== initOpt.correct_order ||
            opt.image !== initOpt.image ||
            opt.hide_text !== initOpt.hide_text ||
            orderOptionImageFiles.has(opt.id)
          );
        });
    } else if (questionType === 'connect') {
      // For connect questions, check if connect options or connections changed
      const initialConnectOptions = (initialValues.current.connectOptions || [])
        .sort((a, b) => (typeof a.id === 'number' ? a.id : 0) - (typeof b.id === 'number' ? b.id : 0));
      const currentConnectOptions = [...connectOptions]
        .sort((a, b) => (typeof a.id === 'number' ? a.id : 0) - (typeof b.id === 'number' ? b.id : 0));
      
      const connectOptionsChanged = 
        currentConnectOptions.length !== initialConnectOptions.length ||
        currentConnectOptions.some((opt, idx) => {
          const initOpt = initialConnectOptions[idx];
          if (!initOpt) return true;
          return (
            opt.text.trim() !== initOpt.text.trim() ||
            opt.position_x !== initOpt.position_x ||
            opt.position_y !== initOpt.position_y ||
            opt.hide_text !== initOpt.hide_text
          );
        }) ||
        initialConnectOptions.some((initOpt, idx) => {
          const opt = currentConnectOptions[idx];
          if (!opt) return true;
          return (
            opt.text.trim() !== initOpt.text.trim() ||
            opt.position_x !== initOpt.position_x ||
            opt.position_y !== initOpt.position_y ||
            opt.hide_text !== initOpt.hide_text
          );
        });
      
      // Check if connections changed
      const initialConnections = (initialValues.current.connectConnections || [])
        .map(([from, to]) => `${Math.min(from, to)}-${Math.max(from, to)}`)
        .sort();
      const currentConnections = connectConnections
        .map(([from, to]) => `${Math.min(from, to)}-${Math.max(from, to)}`)
        .sort();
      
      const connectionsChanged = 
        initialConnections.length !== currentConnections.length ||
        !initialConnections.every((conn, idx) => conn === currentConnections[idx]);
      
      optionsChanged = connectOptionsChanged || connectionsChanged;
    }

    setHasUnsavedChanges(textChanged || topicChanged || imageChanged || hideTextChanged || optionsChanged);
  }, [text, selectedTopic, questionImage, questionImageFile, questionHideText, correctAnswer, tolerance, options, orderOptions, connectOptions, connectConnections, questionType, question, optionImageFiles, orderOptionImageFiles]);

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
      if (window.confirm(t("questions.unsavedChanges"))) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, t]);

  const handleBack = () => {
    if (hasUnsavedChanges && !window.confirm(t("questions.unsavedChanges"))) {
      return;
    }
    if (question) {
      const typePath = question.question_type === 'multiple_choice' 
        ? 'multiple-choice' 
        : question.question_type === 'order'
        ? 'order'
        : question.question_type === 'connect'
        ? 'connect'
        : 'number';
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
      image: null,
      hide_text: false,
      organization: user.organization.id,
      question: question?.id || 0,
      isNew: true,
    };
    setOptions([...options, newOption]);
  };

  const handleRemoveOption = (optionId: number | string) => {
    setOptions(options.filter(opt => opt.id !== optionId));
  };

  const handleUpdateOption = (optionId: number | string, field: 'text' | 'is_correct' | 'image' | 'hide_text', value: string | boolean | null) => {
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
      image: null,
      correct_order: currentMaxOrder + 1,
      hide_text: false,
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

  const handleUpdateOrderOption = (optionId: number | string, field: 'text' | 'correct_order' | 'image' | 'hide_text', value: string | number | boolean) => {
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
      image: null,
      position_x: 0.5,
      position_y: 0.5,
      width: 100,
      height: 60,
      hide_text: false,
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

  const handleUpdateConnectOption = (optionId: number | string, field: 'text' | 'image' | 'width' | 'height' | 'hide_text', value: string | number | boolean) => {
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
        setError(t("questions.questionTextRequired"));
        setSaving(false);
        isSavingRef.current = false;
        return;
      }

      if (!selectedTopic) {
        setError(t("questions.topicRequired"));
        setSaving(false);
        isSavingRef.current = false;
        return;
      }

      // Validate based on question type
      if (questionType === 'multiple_choice') {
        if (options.length === 0) {
          setError(t("questions.atLeastOneOption"));
          setSaving(false);
          isSavingRef.current = false;
          return;
        }
        const hasCorrect = options.some(opt => opt.is_correct);
        if (!hasCorrect) {
          setError(t("questions.atLeastOneCorrect"));
          setSaving(false);
          isSavingRef.current = false;
          return;
        }
      } else if (questionType === 'order') {
        if (orderOptions.length === 0) {
          setError(t("questions.atLeastOneOrderOption"));
          setSaving(false);
          isSavingRef.current = false;
          return;
        }
      } else if (questionType === 'connect') {
        if (connectOptions.length === 0) {
          setError(t("questions.atLeastOneConnectOption"));
          setSaving(false);
          isSavingRef.current = false;
          return;
        }
      } else if (questionType === 'number') {
        // Number questions don't need additional validation beyond text and topic
      }

      let questionId: number;

      if (isCreate) {
        // Create new question
        const questionPayload: any = {
          text: text.trim(),
          question_type: questionType,
          organization: user.organization.id,
          topic: selectedTopic,
          hide_text: questionHideText,
        };
        
        // Add number-specific fields
        if (questionType === 'number') {
          questionPayload.correct_answer = correctAnswer;
          questionPayload.tolerance = tolerance;
        }
        
        const created = await createQuestion(questionPayload);
        questionId = created.id;
        
        // Update question image if provided
        if (questionImageFile || questionHideText !== false) {
          await updateQuestion(questionId, {
            imageFile: questionImageFile || undefined,
            hide_text: questionHideText,
          }, questionType);
        }
        
        // Create options based on question type
        if (questionType === 'number') {
          // Number questions don't have options to create
        } else if (questionType === 'multiple_choice') {
          for (const opt of options) {
            const imageFile = optionImageFiles.get(opt.id);
            await createOption({
              text: opt.text.trim(),
              is_correct: opt.is_correct,
              hide_text: opt.hide_text || false,
              organization: user.organization.id,
              question: questionId,
              imageFile: imageFile || undefined,
            });
          }
        } else if (questionType === 'order') {
          for (const opt of orderOptions) {
            const imageFile = orderOptionImageFiles.get(opt.id);
            await createOrderOption({
              text: opt.text.trim(),
              correct_order: opt.correct_order,
              hide_text: opt.hide_text || false,
              organization: user.organization.id,
              question: questionId,
              imageFile: imageFile || undefined,
            });
          }
        } else if (questionType === 'connect') {
          const createdOptionIds: number[] = [];
          for (const opt of connectOptions) {
            const imageFile = connectOptionImageFiles.get(opt.id);
            const created = await createConnectOption({
              text: opt.text.trim(),
              position_x: opt.position_x,
              position_y: opt.position_y,
              width: opt.width || 100,
              height: opt.height || 60,
              hide_text: opt.hide_text || false,
              organization: user.organization.id,
              question: questionId,
              imageFile: imageFile || undefined,
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
        const createdQuestion = await fetchQuestion(questionId, questionType);
        
        // Set the question first, then update other state
        // Use setTimeout to ensure state updates are processed in order
        setQuestion(createdQuestion);
        setQuestionType(createdQuestion.question_type);
        setText(createdQuestion.text);
        setSelectedTopic(createdQuestion.topic);
        setQuestionHideText(createdQuestion.hide_text || false);
        const imageUrl = createdQuestion.image ? (createdQuestion.image.startsWith('http') ? createdQuestion.image : `http://127.0.0.1:8000${createdQuestion.image}`) : null;
        setQuestionImage(imageUrl);
        setQuestionImageFile(null);
        
        // Force preview refresh by updating key
        setPreviewKey(prev => prev + 1);
        
        // Clear and set options state after a microtask to ensure question is set first
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Clear options state first
        setOptions([]);
        setOrderOptions([]);
        setConnectOptions([]);
        setConnectConnections([]);
        
        // Load options based on question type
        if (createdQuestion.question_type === 'number') {
          const numQ = createdQuestion as NumberQuestionDetail;
          setCorrectAnswer(numQ.correct_answer || 0);
          setTolerance(numQ.tolerance || 0);
          initialValues.current = {
            text: createdQuestion.text,
            topic: createdQuestion.topic,
            image: imageUrl,
            hide_text: createdQuestion.hide_text || false,
            correct_answer: numQ.correct_answer || 0,
            tolerance: numQ.tolerance || 0,
            options: [],
          };
        } else if (createdQuestion.question_type === 'multiple_choice') {
          const opts = ((createdQuestion as MultipleChoiceQuestionDetail).options || []).map(opt => ({ ...opt }));
          setOptions(opts);
          setOptionImageFiles(new Map());
          initialValues.current = {
            text: createdQuestion.text,
            topic: createdQuestion.topic,
            image: imageUrl,
            hide_text: createdQuestion.hide_text || false,
            options: opts.map(opt => ({ ...opt })),
          };
        } else if (createdQuestion.question_type === 'order') {
          const opts = ((createdQuestion as OrderQuestionDetail).order_options || [])
            .map(opt => ({ ...opt }))
            .sort((a, b) => a.correct_order - b.correct_order);
          setOrderOptions(opts);
          setOrderOptionImageFiles(new Map());
          initialValues.current = {
            text: createdQuestion.text,
            topic: createdQuestion.topic,
            image: imageUrl,
            hide_text: createdQuestion.hide_text || false,
            options: [],
            orderOptions: opts.map(opt => ({ ...opt })),
          };
        } else if (createdQuestion.question_type === 'connect') {
          const opts = ((createdQuestion as ConnectQuestionDetail).connect_options || []).map(opt => ({ 
            ...opt,
            width: opt.width || 100,
            height: opt.height || 60,
          }));
          setConnectOptions(opts);
          setConnectOptionImageFiles(new Map());
          const conns = ((createdQuestion as ConnectQuestionDetail).correct_connections || []).map(conn => [conn.from_option, conn.to_option] as [number, number]);
          setConnectConnections(conns);
          initialValues.current = {
            text: createdQuestion.text,
            topic: createdQuestion.topic,
            image: imageUrl,
            hide_text: createdQuestion.hide_text || false,
            options: [],
            connectOptions: opts.map(opt => ({ ...opt })),
            connectConnections: conns.map(([from, to]) => [from, to] as [number, number]),
          };
        }
        
        // Reload course/module/lesson from the created question's topic to ensure we have the correct values
        const allTopics = await fetchTopics();
        const topic = allTopics.find(t => t.id === createdQuestion.topic);
        let savedCourse: number | null = selectedCourse;
        let savedModule: number | null = selectedModule;
        let savedLesson: number | null = selectedLesson;
        
        if (topic) {
          savedLesson = topic.lesson;
          const allLessons = await fetchLessons();
          const lesson = allLessons.find(l => l.id === topic.lesson);
          if (lesson) {
            savedModule = lesson.module;
            const allModules = await fetchModules();
            const mod = allModules.find(m => m.id === lesson.module);
            if (mod) {
              savedCourse = mod.course;
            }
          }
        }
        
        // Save last used selections to localStorage after successful save
        // Use the values from the topic hierarchy to ensure accuracy
        if (savedCourse) {
          setLastCourse(savedCourse);
        }
        if (savedModule) {
          setLastModule(savedModule);
        }
        if (savedLesson) {
          setLastLesson(savedLesson);
        }
        if (createdQuestion.topic) {
          setLastTopic(createdQuestion.topic);
        }
        
        setHasUnsavedChanges(false);
        // Determine type path from the created question
        const typePath = createdQuestion.question_type === 'multiple_choice' 
          ? 'multiple-choice' 
          : createdQuestion.question_type === 'order'
          ? 'order'
          : createdQuestion.question_type === 'connect'
          ? 'connect'
          : 'number';
        navigate(`/questions/${typePath}/${questionId}/edit`, { replace: true });
      } else if (question) {
        // Update existing question (include image file if changed)
        const updatePayload: any = {
          text: text.trim(),
          topic: selectedTopic,
          hide_text: questionHideText,
          imageFile: questionImageFile || undefined,
        };
        
        // Add number-specific fields
        if (question.question_type === 'number') {
          updatePayload.correct_answer = correctAnswer;
          updatePayload.tolerance = tolerance;
        }
        
        await updateQuestion(question.id, updatePayload, question.question_type);

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
              const imageFile = optionImageFiles.get(opt.id);
              await createOption({
                text: opt.text.trim(),
                is_correct: opt.is_correct,
                hide_text: opt.hide_text || false,
                organization: user.organization.id,
                question: question.id,
                imageFile: imageFile || undefined,
              });
            } else if (typeof opt.id === 'number') {
              // Update existing option
              const initOpt = initialValues.current.options.find(o => o.id === opt.id);
              if (!initOpt) continue;

              const imageFile = optionImageFiles.get(opt.id);
              const changed = opt.text.trim() !== initOpt.text.trim() || 
                            opt.is_correct !== initOpt.is_correct ||
                            opt.hide_text !== initOpt.hide_text ||
                            imageFile !== undefined;
              if (changed) {
                await updateOption(opt.id, {
                  text: opt.text.trim(),
                  is_correct: opt.is_correct,
                  hide_text: opt.hide_text || false,
                  imageFile: imageFile || undefined,
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
              const imageFile = orderOptionImageFiles.get(opt.id);
              await createOrderOption({
                text: opt.text.trim(),
                correct_order: opt.correct_order,
                hide_text: opt.hide_text || false,
                organization: user.organization.id,
                question: question.id,
                imageFile: imageFile || undefined,
              });
            } else if (typeof opt.id === 'number') {
              // Update existing option
              const initOpt = initialOrderOptions.find(o => o.id === opt.id);
              if (!initOpt) continue;

              const imageFile = orderOptionImageFiles.get(opt.id);
              const changed = opt.text.trim() !== initOpt.text.trim() || 
                            opt.correct_order !== initOpt.correct_order ||
                            opt.hide_text !== initOpt.hide_text ||
                            imageFile !== undefined;
              if (changed) {
                await updateOrderOption(opt.id, {
                  text: opt.text.trim(),
                  correct_order: opt.correct_order,
                  hide_text: opt.hide_text || false,
                  imageFile: imageFile || undefined,
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
              const imageFile = connectOptionImageFiles.get(opt.id);
              const created = await createConnectOption({
                text: opt.text.trim(),
                position_x: opt.position_x,
                position_y: opt.position_y,
                width: opt.width || 100,
                height: opt.height || 60,
                hide_text: opt.hide_text || false,
                organization: user.organization.id,
                question: question.id,
                imageFile: imageFile || undefined,
              });
              createdOptionIdMap.set(opt.id, created.id);
            } else if (typeof opt.id === 'number') {
              // Update existing option
              const initOpt = initialConnectOptions.find(o => o.id === opt.id);
              if (!initOpt) continue;

              const imageFile = connectOptionImageFiles.get(opt.id);
              const changed = opt.text.trim() !== initOpt.text.trim() || 
                            opt.position_x !== initOpt.position_x || 
                            opt.position_y !== initOpt.position_y ||
                            opt.width !== initOpt.width ||
                            opt.height !== initOpt.height ||
                            opt.hide_text !== initOpt.hide_text ||
                            imageFile !== undefined;
              if (changed) {
                await updateConnectOption(opt.id, {
                  text: opt.text.trim(),
                  position_x: opt.position_x,
                  position_y: opt.position_y,
                  width: opt.width || 100,
                  height: opt.height || 60,
                  hide_text: opt.hide_text || false,
                  imageFile: imageFile || undefined,
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

        // Reload question to get updated data (use question type to avoid fetching wrong question with same ID)
        const updatedQuestion = await fetchQuestion(question.id, question.question_type);
        
        // Set the question first
        setQuestion(updatedQuestion);
        setQuestionType(updatedQuestion.question_type);
        setText(updatedQuestion.text);
        setSelectedTopic(updatedQuestion.topic);
        setQuestionHideText(updatedQuestion.hide_text || false);
        
        // Force preview refresh by updating key
        setPreviewKey(prev => prev + 1);
        
        // Clear and set options state after a microtask to ensure question is set first
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Clear options state
        setOptions([]);
        setOrderOptions([]);
        setConnectOptions([]);
        setConnectConnections([]);
        
        // Reload course/module/lesson from the updated topic
        const allTopics = await fetchTopics();
        const topic = allTopics.find(t => t.id === updatedQuestion.topic);
        let updatedCourse: number | null = null;
        let updatedModule: number | null = null;
        let updatedLesson: number | null = null;
        
        if (topic) {
          updatedLesson = topic.lesson;
          setSelectedLesson(updatedLesson);
          const allLessons = await fetchLessons();
          const lesson = allLessons.find(l => l.id === topic.lesson);
          if (lesson) {
            updatedModule = lesson.module;
            setSelectedModule(updatedModule);
            const allModules = await fetchModules();
            const mod = allModules.find(m => m.id === lesson.module);
            if (mod) {
              updatedCourse = mod.course;
              setSelectedCourse(updatedCourse);
            }
          }
        }
        
        const imageUrl = updatedQuestion.image ? (updatedQuestion.image.startsWith('http') ? updatedQuestion.image : `http://127.0.0.1:8000${updatedQuestion.image}`) : null;
        setQuestionImage(imageUrl);
        setQuestionImageFile(null);
        
        // Load options based on question type
        if (updatedQuestion.question_type === 'number') {
          const numQ = updatedQuestion as NumberQuestionDetail;
          setCorrectAnswer(numQ.correct_answer || 0);
          setTolerance(numQ.tolerance || 0);
          initialValues.current = {
            text: updatedQuestion.text,
            topic: updatedQuestion.topic,
            image: imageUrl,
            hide_text: updatedQuestion.hide_text || false,
            correct_answer: numQ.correct_answer || 0,
            tolerance: numQ.tolerance || 0,
            options: [],
          };
        } else if (updatedQuestion.question_type === 'multiple_choice') {
          const opts = ((updatedQuestion as MultipleChoiceQuestionDetail).options || []).map(opt => ({ ...opt }));
          setOptions(opts);
          setOptionImageFiles(new Map());
          initialValues.current = {
            text: updatedQuestion.text,
            topic: updatedQuestion.topic,
            image: imageUrl,
            hide_text: updatedQuestion.hide_text || false,
            options: opts.map(opt => ({ ...opt })),
          };
        } else if (updatedQuestion.question_type === 'order') {
          const opts = ((updatedQuestion as OrderQuestionDetail).order_options || [])
            .map(opt => ({ ...opt }))
            .sort((a, b) => a.correct_order - b.correct_order);
          setOrderOptions(opts);
          setOrderOptionImageFiles(new Map());
          initialValues.current = {
            text: updatedQuestion.text,
            topic: updatedQuestion.topic,
            image: imageUrl,
            hide_text: updatedQuestion.hide_text || false,
            options: [],
            orderOptions: opts.map(opt => ({ ...opt })),
          };
        } else if (updatedQuestion.question_type === 'connect') {
          const opts = ((updatedQuestion as ConnectQuestionDetail).connect_options || []).map(opt => ({ 
            ...opt,
            width: opt.width || 100,
            height: opt.height || 60,
          }));
          setConnectOptions(opts);
          setConnectOptionImageFiles(new Map());
          const conns = ((updatedQuestion as ConnectQuestionDetail).correct_connections || []).map(conn => [conn.from_option, conn.to_option] as [number, number]);
          setConnectConnections(conns);
          initialValues.current = {
            text: updatedQuestion.text,
            topic: updatedQuestion.topic,
            image: imageUrl,
            hide_text: updatedQuestion.hide_text || false,
            options: [],
            connectOptions: opts.map(opt => ({ ...opt })),
            connectConnections: conns.map(([from, to]) => [from, to] as [number, number]),
          };
        }
        
        // Save last used selections to localStorage after successful save (for updates too)
        // Use the freshly loaded values instead of state to avoid async timing issues
        if (updatedCourse) {
          setLastCourse(updatedCourse);
        }
        if (updatedModule) {
          setLastModule(updatedModule);
        }
        if (updatedLesson) {
          setLastLesson(updatedLesson);
        }
        if (updatedQuestion.topic) {
          setLastTopic(updatedQuestion.topic);
        }
        
        setHasUnsavedChanges(false);
        const typePath = updatedQuestion.question_type === 'multiple_choice' 
          ? 'multiple-choice' 
          : updatedQuestion.question_type === 'order'
          ? 'order'
          : updatedQuestion.question_type === 'connect'
          ? 'connect'
          : 'number';
        navigate(`/questions/${typePath}/${question.id}/edit`, { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("questions.failedToSaveQuestion"));
    } finally {
      setSaving(false);
      setTimeout(() => {
        isSavingRef.current = false;
      }, 100);
    }
  };

  const setInitialQuestionData = (q: QuestionDetail) => {
    // This function is not used for number questions, but kept for backward compatibility
    if (q.question_type === 'multiple_choice') {
      const opts = ((q as MultipleChoiceQuestionDetail).options || []).map(opt => ({ ...opt }));
      // Update all state in one go to prevent double rendering
      setText(q.text);
      setSelectedTopic(q.topic);
      setOptions(opts);
      initialValues.current = {
        text: q.text,
        topic: q.topic,
        image: null,
        hide_text: false,
        options: opts.map(opt => ({ ...opt })),
      };
    }
  };

  // Create a QuestionDetail-like object for preview
  // Use useMemo to prevent double rendering issues and ensure we always use question.options when available
  const previewQuestion: QuestionDetail | null = useMemo(() => {
    if (!question && !(isCreate && text && selectedTopic)) return null;
    
    return questionType === 'number' ? {
      id: question?.id || 0,
      text: text || "",
      order: question?.order || 0,
      question_type: 'number' as const,
      image: questionImage || question?.image || null,
      video: question?.video || null,
      hide_text: questionHideText,
      organization: user?.organization.id || 0,
      quiz: question?.quiz || null,
      topic: selectedTopic || 0,
      topic_name: topics.find(t => t.id === selectedTopic)?.name || "",
      lesson_name: lessons.find(l => l.id === selectedLesson)?.name || "",
      module_name: modules.find(m => m.id === selectedModule)?.name || "",
      course_name: courses.find(c => c.id === selectedCourse)?.name || "",
      quiz_name: null,
      created_at: question?.created_at || "",
      updated_at: question?.updated_at || "",
      correct_answer: correctAnswer,
      tolerance: tolerance,
    } : questionType === 'multiple_choice' ? {
      id: question?.id || 0,
      text: text || "",
      order: question?.order || 0,
      question_type: 'multiple_choice' as const,
      image: questionImage || question?.image || null,
      video: question?.video || null,
      hide_text: questionHideText,
      organization: user?.organization.id || 0,
      quiz: question?.quiz || null,
      topic: selectedTopic || 0,
      topic_name: topics.find(t => t.id === selectedTopic)?.name || "",
      lesson_name: lessons.find(l => l.id === selectedLesson)?.name || "",
      module_name: modules.find(m => m.id === selectedModule)?.name || "",
      course_name: courses.find(c => c.id === selectedCourse)?.name || "",
      quiz_name: null,
      options_count: question && (question as MultipleChoiceQuestionDetail).options 
        ? (question as MultipleChoiceQuestionDetail).options.length 
        : options.length,
      created_at: question?.created_at || "",
      updated_at: question?.updated_at || "",
      options: (() => {
        // Always prefer question.options when question exists and has options
        if (question && question.question_type === 'multiple_choice') {
          const questionOptions = (question as MultipleChoiceQuestionDetail).options;
          if (questionOptions && questionOptions.length > 0) {
            return questionOptions;
          }
        }
        // Fall back to state options only when creating new question
        return options.map(opt => ({
          id: typeof opt.id === 'number' ? opt.id : 0,
          text: opt.text,
          is_correct: opt.is_correct,
          image: opt.image || null,
          hide_text: opt.hide_text || false,
          organization: opt.organization,
          question: opt.question,
          created_at: typeof opt.id === 'number' ? ((question as MultipleChoiceQuestionDetail)?.options?.find(o => o.id === opt.id)?.created_at || '') : '',
          updated_at: typeof opt.id === 'number' ? ((question as MultipleChoiceQuestionDetail)?.options?.find(o => o.id === opt.id)?.updated_at || '') : '',
        }));
      })(),
    } : questionType === 'order' ? {
      id: question?.id || 0,
      text: text || "",
      order: question?.order || 0,
      question_type: 'order' as const,
      image: questionImage || question?.image || null,
      video: question?.video || null,
      hide_text: questionHideText,
      organization: user?.organization.id || 0,
      quiz: question?.quiz || null,
      topic: selectedTopic || 0,
      topic_name: topics.find(t => t.id === selectedTopic)?.name || "",
      lesson_name: lessons.find(l => l.id === selectedLesson)?.name || "",
      module_name: modules.find(m => m.id === selectedModule)?.name || "",
      course_name: courses.find(c => c.id === selectedCourse)?.name || "",
      quiz_name: null,
      order_options_count: orderOptions.length,
      created_at: question?.created_at || "",
      updated_at: question?.updated_at || "",
      order_options: question && (question as OrderQuestionDetail).order_options
        ? (question as OrderQuestionDetail).order_options
        : (() => {
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
                hide_text: opt.hide_text || false,
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
      image: questionImage || question?.image || null,
      video: question?.video || null,
      hide_text: questionHideText,
      organization: user?.organization.id || 0,
      quiz: question?.quiz || null,
      topic: selectedTopic || 0,
      topic_name: topics.find(t => t.id === selectedTopic)?.name || "",
      lesson_name: lessons.find(l => l.id === selectedLesson)?.name || "",
      module_name: modules.find(m => m.id === selectedModule)?.name || "",
      course_name: courses.find(c => c.id === selectedCourse)?.name || "",
      quiz_name: null,
      connect_options_count: connectOptions.length,
      connections_count: connectConnections.length,
      created_at: question?.created_at || "",
      updated_at: question?.updated_at || "",
      connect_options: question && (question as ConnectQuestionDetail).connect_options
        ? (question as ConnectQuestionDetail).connect_options
        : connectOptions.map(opt => ({
            id: typeof opt.id === 'number' ? opt.id : 0,
            text: opt.text,
            image: opt.image || null,
            hide_text: opt.hide_text || false,
            position_x: opt.position_x,
            position_y: opt.position_y,
            width: opt.width || 100,
            height: opt.height || 60,
            organization: opt.organization,
            question: opt.question,
            created_at: typeof opt.id === 'number' ? ((question as ConnectQuestionDetail)?.connect_options?.find(o => o.id === opt.id)?.created_at || '') : '',
            updated_at: typeof opt.id === 'number' ? ((question as ConnectQuestionDetail)?.connect_options?.find(o => o.id === opt.id)?.updated_at || '') : '',
          })),
      correct_connections: question && (question as ConnectQuestionDetail).correct_connections
        ? (question as ConnectQuestionDetail).correct_connections
        : connectConnections.map(([from, to], idx) => ({
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
    };
  }, [
    question,
    isCreate,
    text,
    selectedTopic,
    questionType,
    questionImage,
    questionHideText,
    user?.organization.id,
    topics,
    lessons,
    modules,
    courses,
    correctAnswer,
    tolerance,
    options,
    orderOptions,
    connectOptions,
    connectConnections,
  ]);

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>{isCreate ? t("questions.createQuestion") : t("questions.editQuestion")}</PageHeaderHeading>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>{t("common.back")}</Button>
          <Button
            onClick={handleSave}
            disabled={saving || (!hasUnsavedChanges && !isCreate)}
            variant={!hasUnsavedChanges && !isCreate ? "secondary" : "default"}
          >
            {saving ? t("common.saving") : (hasUnsavedChanges ? t("common.save") : (isCreate ? t("common.save") : t("questions.changesSaved")))}
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
                  {t("questions.questionType")} <span className="text-destructive">*</span>
                </label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={questionType}
                  onChange={(e) => {
                    const newType = e.target.value as 'multiple_choice' | 'order' | 'connect' | 'number';
                    setQuestionType(newType);
                    // Pre-fill text for order questions
                    if (newType === 'order' && isCreate && !text.trim()) {
                      setText(t("questions.putInOrder"));
                    }
                  }}
                  disabled={!isCreate}
                >
                  <option value="multiple_choice">{t("questions.multipleChoice")}</option>
                  <option value="order">{t("questions.order")}</option>
                  <option value="connect">{t("questions.connect")}</option>
                  <option value="number">{t("questions.number")}</option>
                </select>
                {!isCreate && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t("questions.type")}</span>
                    <QuestionTypeBadge questionType={questionType} />
                  </div>
                )}
              </div>
            )}
            {!isCreate && question && (
              <div>
                <label className="block text-sm font-medium mb-1">{t("questions.questionType")}</label>
                <QuestionTypeBadge questionType={question.question_type} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">{t("quizzes.course")}</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={selectedCourse ?? ""}
                onChange={(e) => {
                  const courseId = e.target.value ? Number(e.target.value) : null;
                  setSelectedCourse(courseId);
                  // Don't save to localStorage here - only save when question is saved
                }}
              >
                <option value="">{t("questions.selectCourse")}</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("quizzes.module")}</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                value={selectedModule ?? ""}
                onChange={(e) => {
                  const moduleId = e.target.value ? Number(e.target.value) : null;
                  setSelectedModule(moduleId);
                  // Don't save to localStorage here - only save when question is saved
                }}
                disabled={!selectedCourse || modules.length === 0}
              >
                <option value="">{t("questions.selectModule")}</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("quizzes.lesson")}</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                value={selectedLesson ?? ""}
                onChange={(e) => {
                  const lessonId = e.target.value ? Number(e.target.value) : null;
                  setSelectedLesson(lessonId);
                  // Don't save to localStorage here - only save when question is saved
                }}
                disabled={!selectedModule || lessons.length === 0}
              >
                <option value="">{t("questions.selectLesson")}</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("quizzes.topic")} <span className="text-destructive">*</span>
              </label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                value={selectedTopic ?? ""}
                onChange={(e) => {
                  const topicId = e.target.value ? Number(e.target.value) : null;
                  setSelectedTopic(topicId);
                  // Don't save to localStorage here - only save when question is saved
                }}
                disabled={!selectedLesson || topics.length === 0}
                required
              >
                <option value="">{t("questions.selectTopic")}</option>
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
              {t("questions.questionText")} <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("questions.enterQuestionText")}
              required
            />
            <div className="mt-3">
              <ImageUpload
                value={questionImage}
                onChange={(url, file) => {
                  setQuestionImage(url);
                  setQuestionImageFile(file || null);
                }}
                label={t("questions.questionImage")}
              />
              {questionImage && (
                <div className="mt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={questionHideText}
                      onChange={(e) => setQuestionHideText(e.target.checked)}
                      className="rounded"
                    />
                    <span>{t("questions.hideText")}</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {questionType === 'multiple_choice' && (
            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b p-3">
                <div className="text-sm font-medium">{t("questions.options")}</div>
                <Button size="sm" onClick={handleAddOption}>
                  {t("questions.addOption")}
                </Button>
              </div>
              <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("questions.optionText")}</TableHead>
                      <TableHead className="w-24">{t("questions.correct")}</TableHead>
                      <TableHead className="w-24">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {options.length > 0 ? (
                      options.map((option) => {
                        const imageUrl = option.image ? (option.image.startsWith('http') ? option.image : `http://127.0.0.1:8000${option.image}`) : null;
                        return (
                          <TableRow key={typeof option.id === 'number' ? option.id : option.id}>
                            <TableCell>
                              <input
                                className="w-full rounded-md border px-2 py-1 text-sm"
                                value={option.text}
                                onChange={(e) => handleUpdateOption(option.id, 'text', e.target.value)}
                                placeholder={t("questions.enterOptionText")}
                              />
                              <div className="mt-2">
                                <ImageUpload
                                  value={imageUrl}
                                  onChange={(url, file) => {
                                    handleUpdateOption(option.id, 'image', url);
                                    if (file) {
                                      setOptionImageFiles(prev => new Map(prev).set(option.id, file));
                                    } else {
                                      setOptionImageFiles(prev => {
                                        const newMap = new Map(prev);
                                        newMap.delete(option.id);
                                        return newMap;
                                      });
                                    }
                                  }}
                                  label=""
                                />
                                {imageUrl && (
                                  <div className="mt-2">
                                    <label className="flex items-center gap-2 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={option.hide_text || false}
                                        onChange={(e) => handleUpdateOption(option.id, 'hide_text', e.target.checked)}
                                        className="rounded"
                                      />
                                      <span>{t("questions.hideTextAlt")}</span>
                                    </label>
                                  </div>
                                )}
                              </div>
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
                                {t("questions.remove")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          {t("questions.noOptionsClickAdd")}
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
                <div className="text-sm font-medium">{t("questions.orderOptions")}</div>
                <Button size="sm" onClick={handleAddOrderOption}>
                  {t("questions.addOrderOption")}
                </Button>
              </div>
              <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">{t("common.order")}</TableHead>
                      <TableHead>{t("questions.orderOptionText")}</TableHead>
                      <TableHead className="w-32">{t("common.actions")}</TableHead>
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
                                placeholder={t("questions.enterOptionText")}
                              />
                              <div className="mt-2">
                                <ImageUpload
                                  value={option.image ? (option.image.startsWith('http') ? option.image : `http://127.0.0.1:8000${option.image}`) : null}
                                  onChange={(url, file) => {
                                    handleUpdateOrderOption(option.id, 'image', url || '');
                                    if (file) {
                                      setOrderOptionImageFiles(prev => new Map(prev).set(option.id, file));
                                    } else {
                                      setOrderOptionImageFiles(prev => {
                                        const newMap = new Map(prev);
                                        newMap.delete(option.id);
                                        return newMap;
                                      });
                                    }
                                  }}
                                  label=""
                                />
                                {option.image && (
                                  <div className="mt-2">
                                    <label className="flex items-center gap-2 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={option.hide_text || false}
                                        onChange={(e) => handleUpdateOrderOption(option.id, 'hide_text', e.target.checked)}
                                        className="rounded"
                                      />
                                      <span>{t("questions.hideTextAlt")}</span>
                                    </label>
                                  </div>
                                )}
                              </div>
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
                                  {t("questions.remove")}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          {t("questions.noOptionsClickAdd")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          {questionType === 'number' && (
            <div className="rounded-md border p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("questions.correctAnswer")} <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(parseFloat(e.target.value) || 0)}
                  placeholder={t("questions.enterCorrectAnswer")}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("questions.tolerance")}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseFloat(e.target.value) || 0)}
                  placeholder={t("questions.enterTolerance")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("questions.toleranceHint")}
                </p>
              </div>
            </div>
          )}
          
          {questionType === 'connect' && (
            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b p-3">
                <div className="text-sm font-medium">{t("questions.connectOptions")}</div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddConnectOption}>
                    {t("questions.addConnectOption")}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setLayoutEditorOpen(true)}
                    disabled={connectOptions.length === 0}
                  >
                    {t("questions.editLayout")}
                  </Button>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("questions.optionText")}</TableHead>
                      <TableHead>{t("questions.position")}</TableHead>
                      <TableHead className="w-24">{t("common.actions")}</TableHead>
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
                              placeholder={t("questions.enterOptionText")}
                            />
                            <div className="mt-2">
                              <ImageUpload
                                value={option.image ? (option.image.startsWith('http') ? option.image : `http://127.0.0.1:8000${option.image}`) : null}
                                onChange={(url, file) => {
                                  handleUpdateConnectOption(option.id, 'image', url || '');
                                  if (file) {
                                    setConnectOptionImageFiles(prev => new Map(prev).set(option.id, file));
                                  } else {
                                    setConnectOptionImageFiles(prev => {
                                      const newMap = new Map(prev);
                                      newMap.delete(option.id);
                                      return newMap;
                                    });
                                  }
                                }}
                                label=""
                              />
                              {option.image && (
                                <div className="mt-2">
                                  <label className="flex items-center gap-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={option.hide_text || false}
                                      onChange={(e) => handleUpdateConnectOption(option.id, 'hide_text', e.target.checked)}
                                      className="rounded"
                                    />
                                    <span>{t("questions.hideTextAlt")}</span>
                                  </label>
                                </div>
                              )}
                            </div>
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
                              {t("questions.remove")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          {t("questions.noOptionsClickAddConnect")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {connectConnections.length > 0 && (
                <div className="border-t p-3 text-xs text-muted-foreground">
                  {connectConnections.length} {t("questions.connectionsDefined")}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <QuestionPreview 
            key={previewKey}
            question={previewQuestion}
            onEditLayout={questionType === 'connect' ? () => setLayoutEditorOpen(true) : undefined}
          />
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