import { Project } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

const project = new Project();

const coreFunctions = [
  "getEvents", "createEvent", "getEventById", "updateEvent", "deleteEvent",
  "approveEvent", "archiveEvent", "rejectEvent", "duplicateEvent", 
  "updatePostEventDetails", "getInviteLink"
];

const regFunctions = [
  "registerForEvent", "deregisterEvent", "walkInRegister", "guestRegister", 
  "scanEventPass", "checkInEvent", "exportEventAttendees", "importEventAttendees"
];

const sessionFunctions = [
  "scheduleMeeting", "getSessions", "createSession", "markAttendance"
];

function processFile(filename: string, allowedFuncs: string[]) {
  const filePath = path.join(process.cwd(), "lib/dal", filename);
  const sourceFile = project.addSourceFileAtPath(filePath);
  
  const functions = sourceFile.getFunctions();
  
  for (const func of functions) {
    const name = func.getName();
    if (name && !allowedFuncs.includes(name)) {
      func.remove();
    }
  }
  
  sourceFile.organizeImports();
  sourceFile.saveSync();
  console.log(`Processed ${filename}`);
}

processFile("events.core.ts", coreFunctions);
processFile("events.registration.ts", regFunctions);
processFile("events.session.ts", sessionFunctions);

console.log("Done splitting cleanly.");
