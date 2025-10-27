import { createBrowserRouter } from "react-router-dom";

import { Applayout } from "./components/layouts/AppLayout";

import NoMatch from "./pages/NoMatch";
import Dashboard from "./pages/Dashboard";
import Empty from "./pages/Empty";
import Sample from "./pages/Sample";
import Quizzes from "./pages/Quizzes";
import QuizDetail from "./pages/QuizDetail";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Applayout />,
        children: [
            {
                path: "",
                element: <Dashboard />,
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
                path: "quizzes/:id",
                element: <QuizDetail />,
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
