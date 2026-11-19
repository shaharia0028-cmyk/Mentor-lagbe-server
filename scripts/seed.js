// Seeds realistic, connected demo data: users, tuitions, applications and payments.
//   npm run seed             seeds only when the database is empty
//   npm run seed -- --reset  wipes the database first (never use on real data)
import { applications, client, db, ensureIndexes, payments, tuitions, users } from "../src/config/db.js";
import { auth } from "../src/lib/auth.js";

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
const USER_PASSWORD = process.env.SEED_USER_PASSWORD || "Password@123";

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const banner = (seed) => `https://picsum.photos/seed/${seed}/800/450`;

const people = [
  { name: "Admin User", email: "admin@mentorlagbe.com", role: "admin", plan: "pro", password: ADMIN_PASSWORD, bio: "Platform administrator." },
  { name: "Karim Rahman", email: "tutor@mentorlagbe.com", role: "tutor", plan: "pro", bio: "BUET graduate with 8 years of teaching Physics and Mathematics.", phone: "+880 1700-000001" },
  { name: "Rafiq Hasan", email: "rafiq.tutor@mentorlagbe.com", role: "tutor", plan: "pro", bio: "Software engineer who mentors Python, JavaScript and data science.", phone: "+880 1700-000002" },
  { name: "Farhana Akter", email: "farhana.tutor@mentorlagbe.com", role: "tutor", plan: "pro", bio: "English and IELTS trainer, band 8.5 scorer.", phone: "+880 1700-000003" },
  { name: "Mahmud Hossain", email: "mahmud.tutor@mentorlagbe.com", role: "tutor", plan: "free", bio: "Chemistry and Biology tutor for HSC and admission tests.", phone: "+880 1700-000008" },
  { name: "Nusrat Jahan", email: "student@mentorlagbe.com", role: "student", plan: "free", phone: "+880 1700-000004" },
  { name: "Anika Rahman", email: "anika@student.com", role: "student", plan: "pro", phone: "+880 1700-000005" },
  { name: "Tanvir Hossain", email: "tanvir@student.com", role: "student", plan: "free", phone: "+880 1700-000006" },
  { name: "Sadia Islam", email: "sadia@student.com", role: "student", plan: "free", phone: "+880 1700-000007" },
];

// [tutor email, title, subject, class level, mode, location, fee, days, approval, active, description]
const tuitionRows = [
  ["tutor@mentorlagbe.com", "HSC Physics Crash Course: Mechanics to Modern Physics", "Physics", "HSC", "Online", "Online", 3500, 4, "approved", true, "Concept-first physics batch covering the full HSC syllabus with weekly model tests and recorded classes for revision."],
  ["tutor@mentorlagbe.com", "SSC Mathematics: Algebra and Geometry Mastery", "Mathematics", "SSC", "Offline", "Mirpur, Dhaka", 3000, 3, "approved", true, "Small-group classes focused on problem solving, board question patterns and exam time management."],
  ["tutor@mentorlagbe.com", "University Advanced Calculus and Differential Equations", "Advanced Mathematics", "University", "Online", "Online", 5500, 3, "approved", true, "Step-by-step lectures with solved examples for engineering and science students, plus doubt-clearing sessions."],
  ["tutor@mentorlagbe.com", "Admission Test Physics and Math Preparation", "Physics", "Admission", "Offline", "Dhanmondi, Dhaka", 4500, 5, "approved", false, "Intensive admission batch with daily exams. Currently closed because the batch is full."],
  ["tutor@mentorlagbe.com", "Higher Math Doubt Solving Sessions", "Mathematics", "HSC", "Online", "Online", 2500, 2, "pending", true, "Weekly live doubt sessions for HSC higher math students."],
  ["rafiq.tutor@mentorlagbe.com", "Practical Data Science and Machine Learning with Python", "Data Science", "University", "Online", "Online", 6000, 4, "approved", true, "NumPy, Pandas, Scikit-Learn, data visualization and supervised machine learning with real datasets."],
  ["rafiq.tutor@mentorlagbe.com", "Full-Stack JavaScript and MERN Stack Intensive", "Web Development", "Professional", "Online", "Online", 7500, 4, "approved", true, "Build and deploy three full-stack projects with React, Node.js, Express and MongoDB."],
  ["rafiq.tutor@mentorlagbe.com", "Python Mastery: From Fundamentals to Data Structures", "Programming", "Beginner", "Online", "Online", 3500, 3, "approved", true, "A friendly start to programming with exercises, mini projects and weekly code reviews."],
  ["rafiq.tutor@mentorlagbe.com", "1-on-1 Competitive Programming Mentorship", "Programming", "University", "Online", "Online", 5000, 3, "approved", true, "Personal mentoring for contests: algorithms, practice plans and mock contests."],
  ["rafiq.tutor@mentorlagbe.com", "Machine Learning Project Studio", "Data Science", "Professional", "Online", "Online", 6500, 2, "rejected", true, "Project-based studio. Rejected for an incomplete description."],
  ["farhana.tutor@mentorlagbe.com", "IELTS Academic and General Training: Band 7.5+", "IELTS Preparation", "Professional", "Online", "Online", 5000, 4, "approved", true, "Four-skill IELTS program with weekly mock tests, speaking practice and personal feedback."],
  ["farhana.tutor@mentorlagbe.com", "O-Level English Literature and Essay Composition", "English Literature", "O-Level", "Online", "Online", 2800, 3, "approved", true, "Text analysis, essay structure and exam technique for Cambridge O-Level students."],
  ["farhana.tutor@mentorlagbe.com", "Spoken English for Job Interviews", "Spoken English", "Professional", "Offline", "Uttara, Dhaka", 3000, 3, "approved", true, "Confidence-building speaking classes with role plays and interview simulations."],
  ["mahmud.tutor@mentorlagbe.com", "A-Level Chemistry: Physical, Inorganic and Organic", "Chemistry", "A-Level", "Offline", "Gulshan, Dhaka", 7000, 3, "approved", true, "Complete A-Level chemistry coverage with past paper practice and lab-skill guidance."],
  ["mahmud.tutor@mentorlagbe.com", "HSC Biology and Medical Admission Foundation", "Biology", "HSC", "Offline", "Uttara, Dhaka", 3200, 4, "pending", true, "Diagram-focused biology classes with MCQ practice for medical admission aspirants."],
];

// [student email, tuition index, status, days ago, schedule, note]
const applicationRows = [
  ["student@mentorlagbe.com", 0, "accepted", 14, "Evening (6-8 PM)", "I want to improve my mechanics concepts before the board exam."],
  ["student@mentorlagbe.com", 5, "pending", 5, "Flexible / Discuss with Tutor", "Beginner in Python, ready to practice daily."],
  ["student@mentorlagbe.com", 10, "rejected", 20, "Weekend", "Targeting band 7 in three months."],
  ["anika@student.com", 0, "accepted", 17, "Evening (6-8 PM)", ""],
  ["anika@student.com", 6, "accepted", 12, "Weekend", "Want to build a portfolio project."],
  ["tanvir@student.com", 7, "pending", 7, "Flexible / Discuss with Tutor", "Complete beginner, no coding background."],
  ["tanvir@student.com", 1, "pending", 3, "Afternoon (3-5 PM)", ""],
  ["sadia@student.com", 10, "accepted", 16, "Weekend", "Need help with the speaking section."],
  ["sadia@student.com", 11, "pending", 2, "Evening (6-8 PM)", ""],
  ["sadia@student.com", 13, "rejected", 25, "Flexible / Discuss with Tutor", ""],
];

const paymentRows = [
  ["tutor@mentorlagbe.com", "Karim Rahman", "tutor", "Pro Tutor Plan", 15, 20],
  ["rafiq.tutor@mentorlagbe.com", "Rafiq Hasan", "tutor", "Pro Tutor Plan", 15, 15],
  ["farhana.tutor@mentorlagbe.com", "Farhana Akter", "tutor", "Pro Tutor Plan", 15, 9],
  ["anika@student.com", "Anika Rahman", "student", "Pro Student Plan", 10, 6],
];

async function wipe() {
  const names = ["users", "tuitions", "applications", "payments", "account", "session", "verification", "jwks"];
  await Promise.all(names.map((name) => db.collection(name).deleteMany({})));
  console.log("Existing data removed");
}

async function createUsers() {
  for (const person of people) {
    await auth.api.signUpEmail({
      body: {
        name: person.name,
        email: person.email,
        password: person.password || USER_PASSWORD,
        role: person.role === "tutor" ? "tutor" : "student",
      },
    });

    // Admin role, plan and profile details are set directly because sign up only allows student or tutor.
    await users.updateOne(
      { email: person.email },
      {
        $set: {
          role: person.role,
          plan: person.plan,
          phone: person.phone ?? "",
          bio: person.bio ?? "",
          createdAt: daysAgo(30),
        },
      },
    );
    console.log(`  user: ${person.email} (${person.role})`);
  }
}

async function createTuitions() {
  const tutorNames = new Map(people.map((person) => [person.email, person.name]));

  const docs = tuitionRows.map(([tutorEmail, title, subject, classLevel, mode, location, monthlyFee, daysPerWeek, approvalStatus, isActive, description], index) => ({
    title,
    subject,
    classLevel,
    mode,
    location,
    monthlyFee,
    daysPerWeek,
    bannerImage: banner(`mentorlagbe-${index + 1}`),
    description,
    tutorName: tutorNames.get(tutorEmail),
    tutorEmail,
    approvalStatus,
    isActive,
    createdAt: daysAgo(30 - index),
  }));

  const { insertedIds } = await tuitions.insertMany(docs);
  console.log(`  tuitions: ${docs.length}`);
  return docs.map((_, index) => ({ _id: insertedIds[index], ...docs[index] }));
}

async function createApplications(savedTuitions) {
  const studentNames = new Map(people.map((person) => [person.email, person.name]));
  const studentPlans = new Map(people.map((person) => [person.email, person.plan]));
  const studentPhones = new Map(people.map((person) => [person.email, person.phone]));

  const docs = applicationRows.map(([studentEmail, tuitionIndex, status, ago, preferredSchedule, studentNote]) => {
    const tuition = savedTuitions[tuitionIndex];
    return {
      tuitionId: tuition._id,
      tuitionTitle: tuition.title,
      subject: tuition.subject,
      monthlyFee: tuition.monthlyFee,
      tutorEmail: tuition.tutorEmail,
      studentName: studentNames.get(studentEmail),
      studentEmail,
      studentPhone: studentPhones.get(studentEmail),
      preferredSchedule,
      studentNote,
      isPriority: studentPlans.get(studentEmail) === "pro",
      status,
      appliedAt: daysAgo(ago),
    };
  });

  await applications.insertMany(docs);
  console.log(`  applications: ${docs.length}`);
}

async function createPayments() {
  const docs = paymentRows.map(([userEmail, userName, userRole, planName, amount, ago], index) => ({
    userEmail,
    userName,
    userRole,
    planName,
    amount,
    currency: "usd",
    transactionId: `txn_mock_${String(index + 1).padStart(3, "0")}`,
    stripeSessionId: `cs_test_mock_${String(index + 1).padStart(3, "0")}`,
    paymentStatus: "paid",
    paidAt: daysAgo(ago),
  }));

  await payments.insertMany(docs);
  console.log(`  payments: ${docs.length}`);
}

async function main() {
  await ensureIndexes();

  if (process.argv.includes("--reset")) {
    await wipe();
  } else if ((await users.countDocuments()) > 0) {
    console.log("Database already has users. Run `npm run seed -- --reset` to start fresh.");
    return;
  }

  console.log("Seeding MentorLagbe...");
  await createUsers();
  const savedTuitions = await createTuitions();
  await createApplications(savedTuitions);
  await createPayments();

  console.log("\nDone. Sign in with:");
  console.log(`  Admin:   admin@mentorlagbe.com / ${ADMIN_PASSWORD}`);
  console.log(`  Tutor:   tutor@mentorlagbe.com / ${USER_PASSWORD}`);
  console.log(`  Student: student@mentorlagbe.com / ${USER_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
