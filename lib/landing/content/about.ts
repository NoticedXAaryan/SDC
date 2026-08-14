import { REQUIRED_STATISTICS, type Organizer } from "./contracts";

export const ABOUT_DESCRIPTION =
  "Student Developer Club (SDC) is a vibrant community of tech enthusiasts, developers, and designers. We bring together students at Parul University to learn, build, and share their knowledge on modern web, app, and cloud technologies. Whether you're a beginner writing your first line of code or an experienced hacker, SDC is your launchpad to build meaningful projects and connect with peers.";

export const FESTIVAL_ORGANIZERS: readonly Organizer[] = [
  {
    name: "Tech Workshops",
    description:
      "Hands-on sessions on modern tech stacks, frameworks, and tools. From web development to AI, we cover the skills you need to build real-world applications.",
    logoUrl: "",
  },
  {
    name: "Hackathons",
    description:
      "Intense, collaborative coding events where you can build innovative solutions to real-world problems, win prizes, and get noticed by industry leaders.",
    logoUrl: "",
  },
  {
    name: "Open Source",
    description:
      "Contribute to meaningful real-world projects, learn industry-standard version control workflows, and collaborate seamlessly with a global community of developers to make a lasting impact.",
    logoUrl: "",
  },
];

export const FESTIVAL_STATISTICS = REQUIRED_STATISTICS;
