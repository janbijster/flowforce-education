import { createBrowserRouter, Navigate } from "react-router-dom";

import { Applayout } from "./components/layouts/AppLayout";

import NoMatch from "./pages/NoMatch";
import Dashboard from "./pages/Dashboard";
import Empty from "./pages/Empty";
import Sample from "./pages/Sample";
import Quizzes from "./pages/Quizzes";
import QuizDetail from "./pages/QuizDetail";
import QuizEditor from "./pages/QuizEditor";
import Questions from "./pages/Questions";
import QuestionDetail from "./pages/QuestionDetail";
import QuestionEditor from "./pages/QuestionEditor";
import StudentGroups from "./pages/StudentGroups";
import StudentGroupDetail from "./pages/StudentGroupDetail";
import StudentGroupEditor from "./pages/StudentGroupEditor";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import StudentEditor from "./pages/StudentEditor";
import StudentGroupProgress from "./pages/StudentGroupProgress";
import QuizPreview from "./pages/QuizPreview";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Applayout />,
        children: [
            {
                path: "",
                element: <Navigate to="/student-groups" replace />,
            },
            {
                path: "sample",
                element: <Sample />,
            },
            {
                path: "empty",
                element: <Empty />,
            },
            {
                path: "quizzes",
                element: <Quizzes />,
            },
            {
                path: "quizzes/new",
                element: <QuizEditor />,
            },
            {
                path: "quizzes/:id",
                element: <QuizDetail />,
            },
            {
                path: "quizzes/:id/preview",
                element: <QuizPreview />,
            },
            {
                path: "quizzes/:id/edit",
                element: <QuizEditor />,
            },
            {
                path: "questions",
                element: <Questions />,
            },
            {
                path: "questions/new",
                element: <QuestionEditor />,
            },
            {
                path: "questions/:type/:id",
                element: <QuestionDetail />,
            },
            {
                path: "questions/:type/:id/edit",
                element: <QuestionEditor />,
            },
            {
                path: "student-groups",
                element: <StudentGroups />,
            },
            {
                path: "student-groups/new",
                element: <StudentGroupEditor />,
            },
            {
                path: "student-groups/:id",
                element: <StudentGroupDetail />,
            },
            {
                path: "student-groups/:id/edit",
                element: <StudentGroupEditor />,
            },
            {
                path: "students",
                element: <Students />,
            },
            {
                path: "students/new",
                element: <StudentEditor />,
            },
            {
                path: "students/:id",
                element: <StudentDetail />,
            },
            {
                path: "students/:id/edit",
                element: <StudentEditor />,
            },
            {
                path: "students/:studentId/groups/:groupId",
                element: <StudentGroupProgress />,
            },
        ],
    },
    {
        path: "*",
        element: <NoMatch />,
    },
], {
    basename: global.basename
})
