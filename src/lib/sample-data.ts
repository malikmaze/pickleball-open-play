import type { Session } from "@/types";

function todayAt(hours: number, minutes = 0): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function createSampleSessions(): Session[] {
  const date = todayDate();

  return [
    {
      id: "session-morning",
      title: "Morning Open Play",
      date,
      startTime: "08:00",
      endTime: "10:00",
      location: "SisClub Courts",
      courtNumber: "Court 1",
      skillLevel: "Mixed",
      maxPlayers: 8,
      status: "open",
      players: [
        {
          id: "p1",
          name: "Alex M.",
          skillLevel: "Intermediate",
          joinedAt: todayAt(7, 30),
        },
        {
          id: "p2",
          name: "Jamie L.",
          contactNumber: "09171234567",
          skillLevel: "Beginner",
          joinedAt: todayAt(7, 45),
        },
      ],
    },
    {
      id: "session-afternoon",
      title: "Afternoon Rally",
      date,
      startTime: "14:00",
      endTime: "16:00",
      location: "SisClub Courts",
      courtNumber: "Court 2 & 3",
      skillLevel: "Intermediate",
      maxPlayers: 6,
      status: "open",
      players: [
        {
          id: "p3",
          name: "Taylor S.",
          skillLevel: "Intermediate",
          joinedAt: todayAt(12, 0),
        },
      ],
    },
    {
      id: "session-evening",
      title: "Evening Advanced Play",
      date,
      startTime: "18:00",
      endTime: "20:00",
      location: "SisClub Courts",
      courtNumber: "Court 1",
      skillLevel: "Advanced",
      maxPlayers: 4,
      status: "full",
      players: [
        {
          id: "p4",
          name: "Morgan K.",
          skillLevel: "Advanced",
          joinedAt: todayAt(10, 0),
        },
        {
          id: "p5",
          name: "Riley P.",
          skillLevel: "Advanced",
          joinedAt: todayAt(10, 15),
        },
        {
          id: "p6",
          name: "Casey D.",
          skillLevel: "Advanced",
          joinedAt: todayAt(11, 0),
        },
        {
          id: "p7",
          name: "Jordan W.",
          skillLevel: "Advanced",
          joinedAt: todayAt(11, 30),
        },
      ],
    },
  ];
}
