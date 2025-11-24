import { Icons } from "@/components/icons"

interface NavItem {
    title: string
    to?: string
    href?: string
    disabled?: boolean
    external?: boolean
    icon?: keyof typeof Icons
    label?: string
}

interface NavItemWithChildren extends NavItem {
    items?: NavItemWithChildren[]
}

export const mainMenu: NavItemWithChildren[] = [
    {
        title: 'Students',
        items: [
            {
                title: 'Student Groups',
                to: '/student-groups',
            },
            {
                title: 'Students',
                to: '/students',
            },
        ],
    },
    {
        title: 'Quizzes',
        items: [
            {
                title: 'Quizzes',
                to: '/quizzes',
            },
            {
                title: 'Questions',
                to: '/questions',
            },
        ],
    },
    {
        title: 'Materials',
        items: [
            {
                title: 'Browse Materials',
                to: '/materials',
            },
            {
                title: 'Materials Overview',
                to: '/materials/overview',
            },
        ],
    },
]

export const sideMenu: NavItemWithChildren[] = []
