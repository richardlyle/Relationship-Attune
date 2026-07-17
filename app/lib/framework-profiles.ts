import type { ResultProfile } from "./quiz-types";

const typeNames: Record<string, string> = {
  ISTJ: "Grounded Organizer", ISFJ: "Thoughtful Protector", INFJ: "Insightful Guide", INTJ: "Strategic Independent",
  ISTP: "Calm Problem-Solver", ISFP: "Gentle Individualist", INFP: "Values-Led Dreamer", INTP: "Curious Analyst",
  ESTP: "Energetic Improviser", ESFP: "Warm Spark", ENFP: "Possibility Starter", ENTP: "Inventive Challenger",
  ESTJ: "Practical Director", ESFJ: "Community Builder", ENFJ: "Encouraging Connector", ENTJ: "Vision-Driven Leader",
};
const energy = { E: "You tend to process through outward engagement and shared energy", I: "You tend to process through reflection and protected inner space" };
const information = { S: "trusting concrete details and lived experience", N: "tracking patterns, meaning, and future possibility" };
const decisions = { T: "You first test decisions for logic and consistency", F: "You first test decisions for values and human impact" };
const rhythm = { J: "Dependable plans usually help you relax", P: "Freedom to adapt usually helps you relax" };
const energyCare = { E: "Share experiences and respond with visible engagement.", I: "Give quiet processing time without treating it as distance." };
const informationCare = { S: "Be specific, practical, and consistent.", N: "Take their ideas and interpretations seriously." };
const decisionsCare = { T: "Say emotional needs plainly instead of relying on hints.", F: "Pair difficult truth with warmth and reassurance." };

export const sixteenTypeProfiles = Object.fromEntries(Object.keys(typeNames).map((type) => [type, {
  title: `${type} · ${typeNames[type]}`,
  summary: `${energy[type[0] as "E" | "I"]}, ${information[type[1] as "S" | "N"]}. ${decisions[type[2] as "T" | "F"]}. ${rhythm[type[3] as "J" | "P"]}.`,
  care: [energyCare[type[0] as "E" | "I"], informationCare[type[1] as "S" | "N"], decisionsCare[type[2] as "T" | "F"]],
  watchFor: type[3] === "J" ? "A preference for closure can become pressure when a partner needs more time." : "A preference for flexibility can feel uncertain to a partner who needs a clear plan.",
}] as [string, ResultProfile]));

export const discProfiles: Record<string, ResultProfile> = {
  D: { title: "D · Drive", summary: "You tend to prioritize results, autonomy, and forward motion. Directness often feels caring because it creates clarity.", care: ["Be clear, concise, and honest.", "Offer choices instead of unnecessary control.", "Respect goals while inviting a softer pace at home."], watchFor: "Speed and bluntness can make a partner feel left behind." },
  I: { title: "I · Influence", summary: "You tend to prioritize enthusiasm, connection, and possibility. Shared energy helps you feel seen and motivated.", care: ["Respond visibly when they share excitement.", "Make room for play and social connection.", "Use warm reminders to support follow-through."], watchFor: "Optimism can skip details or difficult feelings that still need attention." },
  S: { title: "S · Steadiness", summary: "You tend to prioritize trust, cooperation, and a manageable pace. Consistency is one of your strongest forms of love.", care: ["Give advance notice before major changes.", "Invite their opinion without rushing the answer.", "Notice dependable care that could look invisible."], watchFor: "Keeping the peace can delay a needed boundary or honest no." },
  C: { title: "C · Conscientiousness", summary: "You tend to prioritize accuracy, quality, and thoughtful standards. Preparation helps you feel calm and respectful.", care: ["Bring context and specifics to important talks.", "Give time to think and check details.", "Appreciate high standards without demanding perfection."], watchFor: "Analysis and correction can unintentionally crowd out warmth." },
};

export const bigFiveProfiles: Record<string, ResultProfile> = {
  O: { title: "Openness · The Explorer", summary: "Curiosity, imagination, and receptiveness to new ideas are especially visible in your current pattern.", care: ["Keep learning and trying new things together.", "Take unusual ideas seriously.", "Balance novelty with one steady ritual."], watchFor: "Possibility can make routine needs feel dull or delayed." },
  C: { title: "Conscientiousness · The Builder", summary: "Organization, responsibility, and follow-through are especially visible in your current pattern.", care: ["Keep agreements and communicate changes early.", "Recognize the effort behind preparation.", "Help create rest that does not feel irresponsible."], watchFor: "High standards can become pressure for both people." },
  E: { title: "Extraversion · The Energizer", summary: "Social energy, assertiveness, and positive engagement are especially visible in your current pattern.", care: ["Share experiences and respond with visible warmth.", "Make room for conversation and outward activity.", "Do not personalize a quieter partner’s recharge."], watchFor: "Fast outward energy can miss subtle cues to slow down." },
  A: { title: "Agreeableness · The Harmonizer", summary: "Compassion, cooperation, and trust are especially visible in your current pattern.", care: ["Return the care they give freely.", "Invite honest preferences, not only agreement.", "Use a gentle tone without avoiding truth."], watchFor: "Kindness without boundaries can turn into resentment." },
  N: { title: "Emotional Sensitivity · The Early Sensor", summary: "Emotional responsiveness and awareness of possible threats are especially visible in your current pattern.", care: ["Offer clear reassurance during uncertainty.", "Avoid minimizing intense feelings.", "Separate the immediate problem from every possible outcome."], watchFor: "Sensitivity is useful information, but ambiguity can magnify it." },
};

const enneagramData: Record<string, [string, string, string, string]> = {
  "1": ["The Improver", "being good, responsible, and aligned with your standards", "Create space where good enough is enough.", "The inner critic can become relationship tension."],
  "2": ["The Helper", "being loving, useful, and meaningfully connected", "Offer affection that is not earned through helping.", "Unspoken giving can create unspoken expectations."],
  "3": ["The Achiever", "being valuable, effective, and recognized", "Value them beyond productivity.", "Momentum can hide exhaustion or sadness."],
  "4": ["The Individualist", "being authentic, significant, and deeply understood", "Stay present with complex feelings.", "Longing can enlarge what feels missing."],
  "5": ["The Investigator", "being capable, informed, and protected from overwhelm", "Give advance notice and room to prepare.", "Conserving energy can look like withholding."],
  "6": ["The Loyalist", "finding security, trustworthy support, and preparedness", "Be predictable and transparent.", "Seeking certainty can create more doubt."],
  "7": ["The Enthusiast", "staying free, hopeful, and open to possibility", "Share delight and stay present when feelings get heavy.", "Pain reframed too quickly can remain unresolved."],
  "8": ["The Challenger", "protecting autonomy and standing up for what matters", "Speak plainly and keep your word.", "Intensity can overpower a partner."],
  "9": ["The Peacemaker", "preserving inner calm and connection", "Ask for their preference and wait for the real answer.", "Avoiding disruption can erase their priorities."],
};
export const enneagramProfiles = Object.fromEntries(Object.entries(enneagramData).map(([key, data]) => [key, {
  title: `Type ${key} · ${data[0]}`, summary: `You may be organized around ${data[1]}.`,
  care: [data[2], "Name appreciation specifically.", "Support a direct request instead of guessing."], watchFor: data[3],
}] as [string, ResultProfile]));

export const attachmentProfiles: Record<string, ResultProfile> = {
  secure: { title: "Secure-Leaning", summary: "You generally expect closeness and independence to coexist and can seek repair without losing yourself.", care: ["Keep communication direct and reciprocal.", "Maintain both shared and individual life.", "Name needs before resentment builds."], watchFor: "Even secure patterns can shift under major stress." },
  anxious: { title: "Anxious-Leaning", summary: "Uncertainty can intensify your need for reassurance and quick reconnection when signals feel mixed.", care: ["Offer clear, consistent reassurance.", "Communicate gaps in availability early.", "Pair closeness with support for self-soothing."], watchFor: "Urgent reassurance-seeking can create the distance it fears." },
  avoidant: { title: "Avoidant-Leaning", summary: "Autonomy helps you feel safe, and emotional pressure can make you pull inward even when the bond matters.", care: ["Give space with a clear reconnection time.", "Use specific, low-pressure questions.", "Respect independence while keeping warmth visible."], watchFor: "Self-protection can look like indifference from the outside." },
  fearful: { title: "Fearful-Avoidant Leaning", summary: "You may long for closeness while bracing for hurt, creating a push-pull response when vulnerability rises.", care: ["Build trust through small, repeated acts.", "Avoid sudden pressure or withdrawal.", "Let boundaries and closeness grow together."], watchFor: "This reflection is not a diagnosis; intense patterns may be worth exploring with a professional." },
};

export const careProfiles: Record<string, ResultProfile> = {
  presence: { title: "Steady Presence", summary: "You feel loved through focused time, physical warmth, and the sense that someone is truly with you.", care: ["Put distractions away during important talks.", "Offer closeness before trying to fix the problem.", "Plan small pockets of intentional time."], watchFor: "Multitasking can feel like disinterest even when it is not." },
  words: { title: "Spoken Reassurance", summary: "Care becomes real when it is named. Specific, sincere words help you feel secure and understood.", care: ["Say what you appreciate.", "Reassure directly after tense moments.", "Leave occasional notes or voice messages."], watchFor: "Silence can create uncertainty." },
  actions: { title: "Thoughtful Action", summary: "You trust care you can see: follow-through, practical help, and details remembered.", care: ["Notice one task that would lighten the load.", "Follow through on small promises.", "Remember preferences and details."], watchFor: "Words without follow-through can feel discouraging." },
};
