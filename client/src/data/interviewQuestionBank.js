/**
 * CareerMatrix Centralized Interview Question Bank
 * Contains 120+ curated, authentic interview questions categorized by Career Field & Difficulty Level.
 */

export const INTERVIEW_QUESTION_BANK = [
  // ==========================================
  // 1. SOFTWARE / IT
  // ==========================================
  {
    id: 101,
    field: "Software / IT",
    difficulty: "Basic",
    question: "What is the difference between Object-Oriented Programming (OOP) and Functional Programming?",
    keyConcepts: ["OOP Principles", "Immutability", "Pure Functions", "Encapsulation"],
    hint: "Compare classes and state mutation against pure functions, immutable data, and first-class functions.",
  },
  {
    id: 102,
    field: "Software / IT",
    difficulty: "Basic",
    question: "How does relational database indexing work, and what are the trade-offs of creating multiple indexes?",
    keyConcepts: ["B-Trees", "Search Time vs Write Latency", "Index Overhead"],
    hint: "Explain how B-tree indexes speed up SELECT queries while adding write overhead on INSERT/UPDATE/DELETE.",
  },
  {
    id: 103,
    field: "Software / IT",
    difficulty: "Intermediate",
    question: "What is the difference between REST and GraphQL, and how do you decide which one to use?",
    keyConcepts: ["Over-fetching / Under-fetching", "Endpoint Structure", "Schema Definition"],
    hint: "Discuss fixed REST endpoints vs client-specified GraphQL queries and caching complexities.",
  },
  {
    id: 104,
    field: "Software / IT",
    difficulty: "Intermediate",
    question: "How do you handle asynchronous operations and race conditions in modern web applications?",
    keyConcepts: ["Promises / Async-Await", "Event Loop", "Optimistic Locking", "Debouncing / Throttling"],
    hint: "Walk through JavaScript event loop mechanics, canceling stale promises, and mutex/locking strategies.",
  },
  {
    id: 105,
    field: "Software / IT",
    difficulty: "Advanced",
    question: "How would you design a distributed caching layer (like Redis) for a high-traffic microservices application to prevent cache stampedes and ensure consistency?",
    keyConcepts: ["Cache Aside Pattern", "Cache Stampede (XFetch / Mutex)", "TTL Jitter", "Cache Invalidation"],
    hint: "Detail cache-aside vs write-through, early cache expiration probabilistic algorithms, and pub/sub invalidation.",
  },
  {
    id: 106,
    field: "Software / IT",
    difficulty: "Advanced",
    question: "Explain optimistic vs pessimistic concurrency control in distributed databases under high write contention.",
    keyConcepts: ["MVCC", "Row-Level Locking", "Lost Updates", "Retry Logic"],
    hint: "Compare version check retries against exclusive row locks when multiple nodes mutate the same record.",
  },

  // ==========================================
  // 2. CYBERSECURITY / INFORMATION SECURITY
  // ==========================================
  {
    id: 201,
    field: "Cybersecurity / Information Security",
    difficulty: "Basic",
    question: "What is the difference between authentication and authorization, and how do they work together?",
    keyConcepts: ["Identity Verification", "Access Control / RBAC", "Tokens & Session Management"],
    hint: "Explain verifying WHO someone is (AuthN) versus WHAT permissions they have (AuthZ).",
  },
  {
    id: 202,
    field: "Cybersecurity / Information Security",
    difficulty: "Basic",
    question: "What are the core components of the CIA Triad, and how do you apply them in securing enterprise systems?",
    keyConcepts: ["Confidentiality", "Integrity", "Availability"],
    hint: "Explain encryption for confidentiality, digital signatures/hashes for integrity, and redundancy for availability.",
  },
  {
    id: 203,
    field: "Cybersecurity / Information Security",
    difficulty: "Intermediate",
    question: "How does a Cross-Site Scripting (XSS) attack work, and what defense-in-depth measures prevent Stored and Reflected XSS?",
    keyConcepts: ["DOM-based vs Reflected vs Stored XSS", "Content Security Policy (CSP)", "Contextual Output Encoding"],
    hint: "Detail script injection via untrusted inputs, sanitize HTML, set HttpOnly cookies, and configure strict CSP headers.",
  },
  {
    id: 204,
    field: "Cybersecurity / Information Security",
    difficulty: "Intermediate",
    question: "Describe your step-by-step incident response procedure when a suspicious ransomware alert is triggered on an endpoint.",
    keyConcepts: ["Containment & Isolation", "Evidence Preservation", "Eradication & Recovery", "Post-Incident Review"],
    hint: "Follow NIST incident handling steps: network isolation, memory dumps, hash verification, backup validation, and RCA.",
  },
  {
    id: 205,
    field: "Cybersecurity / Information Security",
    difficulty: "Advanced",
    question: "How do you implement a Zero Trust Architecture (ZTA) across multi-cloud infrastructure, and how do you manage continuous verification?",
    keyConcepts: ["Micro-Segmentation", "Identity as Perimeter", "mTLS Encryption", "Risk-Based Access Evaluation"],
    hint: "Explain moving beyond perimeter firewalls with continuous session scoring, least-privilege, and device posture checks.",
  },
  {
    id: 206,
    field: "Cybersecurity / Information Security",
    difficulty: "Advanced",
    question: "How do you detect and defend against Pass-the-Hash and Kerberos Golden Ticket lateral movement attacks in an Active Directory environment?",
    keyConcepts: ["LSASS Memory Protection", "Credential Guard", "Tiered Admin Models", "Honey Tokens"],
    hint: "Discuss isolating KRBTGT password rotation, enabling Credential Guard, and monitoring anomalous ticket lifetimes.",
  },

  // ==========================================
  // 3. MECHANICAL ENGINEERING
  // ==========================================
  {
    id: 301,
    field: "Mechanical Engineering",
    difficulty: "Basic",
    question: "What is the difference between stress and strain, and how do you interpret a typical stress-strain curve for ductile materials?",
    keyConcepts: ["Elastic Limit", "Yield Strength", "Ultimate Tensile Strength (UTS)", "Plastic Deformation"],
    hint: "Explain proportional limit, Young's modulus, 0.2% yield offset, necking, and rupture point.",
  },
  {
    id: 302,
    field: "Mechanical Engineering",
    difficulty: "Basic",
    question: "What are the common heat treatment processes for medium carbon steel, and how do they alter mechanical properties?",
    keyConcepts: ["Annealing", "Normalizing", "Quenching", "Tempering"],
    hint: "Discuss austenite to martensite transformation, balancing hardness, toughness, and relieving internal stresses.",
  },
  {
    id: 303,
    field: "Mechanical Engineering",
    difficulty: "Intermediate",
    question: "How do you size and select rolling element bearings versus hydrodynamic journal bearings for high-speed rotating machinery?",
    keyConcepts: ["L10 Bearing Life", "Sommerfeld Number", "Dynamic Load Rating", "Oil Film Thickness"],
    hint: "Compare point/line contact fatigue life in ball/roller bearings against hydrodynamic fluid film lubrication.",
  },
  {
    id: 304,
    field: "Mechanical Engineering",
    difficulty: "Intermediate",
    question: "How do you perform a tolerance stack-up analysis using Worst-Case versus Root-Sum-Square (RSS) statistical tolerancing?",
    keyConcepts: ["Worst-Case Stack", "RSS Statistical Tolerancing", "Geometric Dimensioning & Tolerancing (GD&T)"],
    hint: "Explain linear addition of absolute limits versus RSS assuming normal distributions for cost-effective manufacturing.",
  },
  {
    id: 305,
    field: "Mechanical Engineering",
    difficulty: "Advanced",
    question: "In Finite Element Analysis (FEA), how do you identify artificial stress singularities near sharp re-entrant corners versus true high-stress concentrations?",
    keyConcepts: ["h-Refinement vs p-Refinement", "Stress Singularities", "Von Mises Criterion", "Fillet Modeling"],
    hint: "Explain why peak stress grows infinitely on non-radiused mesh refinement, and how to apply real fillet geometry or St. Venant principle.",
  },
  {
    id: 306,
    field: "Mechanical Engineering",
    difficulty: "Advanced",
    question: "Detail an advanced optimization framework for high-temperature creep deformation and thermal fatigue in gas turbine blades.",
    keyConcepts: ["Larson-Miller Parameter", "Single-Crystal Superalloys", "Thermal Barrier Coatings (TBC)", "Film Cooling"],
    hint: "Discuss primary/secondary/tertiary creep stages, grain boundary sliding elimination via single crystals, and serpentine cooling channels.",
  },

  // ==========================================
  // 4. CHEMICAL ENGINEERING
  // ==========================================
  {
    id: 401,
    field: "Chemical Engineering",
    difficulty: "Basic",
    question: "What are unit operations in chemical engineering, and how do they differ from chemical unit processes?",
    keyConcepts: ["Physical Separation", "Chemical Reactions", "Mass & Energy Balances"],
    hint: "Differentiate physical transformations (distillation, filtration, drying) from chemical conversions (polymerization, oxidation).",
  },
  {
    id: 402,
    field: "Chemical Engineering",
    difficulty: "Basic",
    question: "How do you calculate the Log Mean Temperature Difference (LMTD) for co-current versus counter-current shell-and-tube heat exchangers?",
    keyConcepts: ["LMTD Formula", "Heat Exchanger Efficiency", "Counter-Current Advantages"],
    hint: "Explain why counter-current flow maintains a more uniform temperature gradient and higher thermal efficiency.",
  },
  {
    id: 403,
    field: "Chemical Engineering",
    difficulty: "Intermediate",
    question: "How do Continuous Stirred-Tank Reactors (CSTR) compare to Plug Flow Reactors (PFR) in terms of space time and conversion for positive-order kinetics?",
    keyConcepts: ["Residence Time Distribution", "Design Equations", "Conversion Efficiency", "Reaction Order"],
    hint: "Explain why PFR requires smaller reactor volume than CSTR for the same conversion when reaction order is greater than zero.",
  },
  {
    id: 404,
    field: "Chemical Engineering",
    difficulty: "Intermediate",
    question: "How do you break maximum-boiling or minimum-boiling azeotropes using extractive distillation versus pressure-swing distillation?",
    keyConcepts: ["Vapor-Liquid Equilibrium (VLE)", "Entrainer Selection", "Pressure-Sensitive Azeotropes"],
    hint: "Discuss altering relative volatility by adding high-boiling solvents versus shifting the azeotropic point with operating pressure.",
  },
  {
    id: 405,
    field: "Chemical Engineering",
    difficulty: "Advanced",
    question: "How do you conduct a Hazard and Operability (HAZOP) study and Layer of Protection Analysis (LOPA) for an exothermic chemical reaction vessel?",
    keyConcepts: ["HAZOP Guide Words", "Safety Instrumented Systems (SIS)", "SIL Ratings", "Runaway Reaction Mitigation"],
    hint: "Walk through More/Less Flow/Temp deviations, rupture disks, emergency quenching, and calculating Target Risk Reduction.",
  },
  {
    id: 406,
    field: "Chemical Engineering",
    difficulty: "Advanced",
    question: "Explain catalyst deactivation mechanisms (coking, poisoning, sintering) and design considerations for fixed-bed reactor regeneration cycles.",
    keyConcepts: ["Carbon Deposition (Coking)", "Active Site Poisoning", "Thermal Sintering", "Decoking Protocols"],
    hint: "Detail controlled oxygen/steam burn-off kinetics without exceeding maximum allowable catalyst bed temperature.",
  },

  // ==========================================
  // 5. CIVIL ENGINEERING
  // ==========================================
  {
    id: 501,
    field: "Civil Engineering",
    difficulty: "Basic",
    question: "What is the concrete slump test, and how does the water-cement ratio impact both workability and compressive strength?",
    keyConcepts: ["Workability", "Compressive Strength", "Water-Cement Ratio (w/c)", "Hydration"],
    hint: "Explain measuring fresh concrete consistency and why excess water reduces 28-day cured compressive strength.",
  },
  {
    id: 502,
    field: "Civil Engineering",
    difficulty: "Basic",
    question: "How do you construct Shear Force Diagrams (SFD) and Bending Moment Diagrams (BMD) for simply supported beams with point and distributed loads?",
    keyConcepts: ["Shear Force", "Bending Moment", "Points of Contraflexure", "Equilibrium Equations"],
    hint: "Explain integration relationships between distributed load, shear force, and bending moment curves.",
  },
  {
    id: 503,
    field: "Civil Engineering",
    difficulty: "Intermediate",
    question: "What are the primary differences between shallow foundations (isolated/raft footings) and deep pile foundations, and when is each used?",
    keyConcepts: ["Bearing Capacity", "Settlement Analysis", "Skin Friction vs End Bearing", "Soil Stratigraphy"],
    hint: "Discuss soil load-bearing capacity at shallow depth versus transferring heavy structural loads to deeper competent rock strata.",
  },
  {
    id: 504,
    field: "Civil Engineering",
    difficulty: "Intermediate",
    question: "How does prestressed concrete (pre-tensioning vs post-tensioning) overcome concrete's inherent weakness in tension?",
    keyConcepts: ["Prestressing Tendons", "Pre-Tensioning vs Post-Tensioning", "Friction & Creep Losses", "Crack Resistance"],
    hint: "Explain inducing compressive stresses into the member prior to external loading to counteract tensile bending stresses.",
  },
  {
    id: 505,
    field: "Civil Engineering",
    difficulty: "Advanced",
    question: "How do you perform seismic design for high-rise structures using response spectrum analysis and seismic base isolation?",
    keyConcepts: ["Ductility Reduction Factor", "Lead-Rubber Bearings", "Inter-Story Drift Limits", "Modal Analysis"],
    hint: "Explain shifting the fundamental natural period of the building beyond peak ground acceleration frequency to reduce inertial forces.",
  },
  {
    id: 506,
    field: "Civil Engineering",
    difficulty: "Advanced",
    question: "How do you evaluate and design sustainable urban drainage systems (SuDS) and detention basins to handle 100-year storm events?",
    keyConcepts: ["Rational Method / Hydrograph Analysis", "Peak Runoff Rate", "Infiltration Basins", "Porous Pavements"],
    hint: "Calculate peak discharge, attenuation storage volumes, and downstream water quality filtration under extreme climate scenarios.",
  },

  // ==========================================
  // 6. ELECTRICAL / ELECTRONICS
  // ==========================================
  {
    id: 601,
    field: "Electrical / Electronics",
    difficulty: "Basic",
    question: "What are Kirchhoff's Current Law (KCL) and Voltage Law (KVL), and how are they derived from fundamental physics conservation laws?",
    keyConcepts: ["Conservation of Charge", "Conservation of Energy", "Nodal & Mesh Analysis"],
    hint: "Explain current sum at any node is zero (charge conservation) and voltage sum around any closed loop is zero (energy conservation).",
  },
  {
    id: 602,
    field: "Electrical / Electronics",
    difficulty: "Basic",
    question: "What is the operational difference between inverting and non-inverting operational amplifier (Op-Amp) configurations?",
    keyConcepts: ["Virtual Ground", "Feedback Loop", "Voltage Gain Equations", "Input Impedance"],
    hint: "Explain virtual ground principle at negative terminal, gain calculation with feedback resistors, and input impedance differences.",
  },
  {
    id: 603,
    field: "Electrical / Electronics",
    difficulty: "Intermediate",
    question: "How do switch-mode power supplies (Buck and Boost DC-DC converters) operate, and how do you calculate inductor ripple current?",
    keyConcepts: ["Duty Cycle", "Inductor Energy Storage", "Continuous Conduction Mode (CCM)", "Switching Losses"],
    hint: "Walk through MOSFET on/off cycles, diode freewheeling, and inductor volt-second balance equations.",
  },
  {
    id: 604,
    field: "Electrical / Electronics",
    difficulty: "Intermediate",
    question: "How do you design printed circuit board (PCB) layouts to minimize electromagnetic interference (EMI) and signal crosstalk?",
    keyConcepts: ["Return Current Ground Paths", "Differential Pair Routing", "Decoupling Capacitors", "Ground Planes"],
    hint: "Discuss high-frequency return paths following path of least inductance directly beneath signal traces.",
  },
  {
    id: 605,
    field: "Electrical / Electronics",
    difficulty: "Advanced",
    question: "How do you achieve timing closure and resolve clock domain crossing (CDC) metastability in high-speed FPGA and ASIC designs?",
    keyConcepts: ["Setup & Hold Slack", "Dual-Flop Synchronizers", "Asynchronous FIFOs", "Gray Coding"],
    hint: "Explain MTBF calculations for metastable states and using pointer Gray codes to transfer data safely across asynchronous clock domains.",
  },
  {
    id: 606,
    field: "Electrical / Electronics",
    difficulty: "Advanced",
    question: "How do Active Power Factor Correction (PFC) converters and active harmonic filters mitigate Total Harmonic Distortion (THD) under non-linear grid loads?",
    keyConcepts: ["IEEE 519 Standards", "THD Calculation", "Pulse-Width Modulated Rectification", "Active Power Filter"],
    hint: "Explain shaping input current to follow voltage sinusoid phase, eliminating reactive power penalties and harmonic overheating.",
  },

  // ==========================================
  // 7. MECHATRONICS / ROBOTICS
  // ==========================================
  {
    id: 701,
    field: "Mechatronics / Robotics",
    difficulty: "Basic",
    question: "What is the difference between forward kinematics and inverse kinematics in robotic manipulator arms?",
    keyConcepts: ["Joint Space vs Cartesian Space", "Denavit-Hartenberg (D-H) Parameters", "Kinematic Solutions"],
    hint: "Explain computing end-effector position from joint angles (forward) versus finding required joint angles for a desired target coordinate (inverse).",
  },
  {
    id: 702,
    field: "Mechatronics / Robotics",
    difficulty: "Basic",
    question: "How does a PID controller work in regulating the speed and position of a DC servo motor?",
    keyConcepts: ["Proportional, Integral, Derivative", "Error Correction", "Overshoot & Settling Time"],
    hint: "Describe current error proportional kick, steady-state error elimination with integral, and overshoot damping with derivative.",
  },
  {
    id: 703,
    field: "Mechatronics / Robotics",
    difficulty: "Intermediate",
    question: "How do you integrate sensor fusion algorithms (e.g., Extended Kalman Filter / Complementary Filter) with IMUs and wheel encoders for mobile robot localization?",
    keyConcepts: ["Dead Reckoning Drift", "Kalman Gain", "State Estimation", "Covariance Matrices"],
    hint: "Discuss combining high-rate noisy accelerometer/gyroscope readings with encoder odometry to minimize drift error.",
  },
  {
    id: 704,
    field: "Mechatronics / Robotics",
    difficulty: "Intermediate",
    question: "What is the Robot Operating System (ROS / ROS2) node architecture, and how do Topics, Services, and Actions differ in communication patterns?",
    keyConcepts: ["Publish-Subscribe", "Client-Server Services", "Long-Running Action Servers", "DDS Middleware"],
    hint: "Explain asynchronous streaming telemetry (topics), blocking request-response (services), and preemptible goal execution with feedback (actions).",
  },
  {
    id: 705,
    field: "Mechatronics / Robotics",
    difficulty: "Advanced",
    question: "How do you formulate collision-free trajectory planning in high-dimensional configuration spaces using RRT* (Rapidly-exploring Random Trees) or TrajOpt?",
    keyConcepts: ["Configuration Space (C-Space)", "Asymptotic Optimality", "Obstacle Avoidance", "Trajectory Smoothing"],
    hint: "Detail random state sampling, nearest neighbor steering, rewiring trees for optimal path length, and enforcing velocity/acceleration limits.",
  },
  {
    id: 706,
    field: "Mechatronics / Robotics",
    difficulty: "Advanced",
    question: "How do you implement real-time visual Simultaneous Localization and Mapping (vSLAM) on resource-constrained embedded edge hardware?",
    keyConcepts: ["ORB-SLAM / VIO", "Keyframe Selection", "Bundle Adjustment", "Loop Closure Detection"],
    hint: "Discuss trade-offs between feature-based and direct SLAM, optimizing local bundle adjustment matrices, and GPU/NPU acceleration.",
  },

  // ==========================================
  // 8. AUTOMOBILE ENGINEERING
  // ==========================================
  {
    id: 801,
    field: "Automobile Engineering",
    difficulty: "Basic",
    question: "What are the fundamental differences between four-stroke Internal Combustion Engines and Electric Vehicle (EV) powertrains?",
    keyConcepts: ["Thermal Efficiency", "Instant Torque Delivery", "Transmission Requirements", "Emissions"],
    hint: "Compare ICE combustion cycles, fuel injection, and multi-speed gearboxes against electric motor torque curves and direct drive systems.",
  },
  {
    id: 802,
    field: "Automobile Engineering",
    difficulty: "Basic",
    question: "What is Ackermann steering geometry, and why is it essential for preventing tire scrub during cornering?",
    keyConcepts: ["Turning Radius", "Inner vs Outer Wheel Angles", "Kingpin Inclination", "Tire Slip Angle"],
    hint: "Explain why the inner wheel must turn at a sharper angle than the outer wheel to trace concentric turning circles around the rear axle line.",
  },
  {
    id: 803,
    field: "Automobile Engineering",
    difficulty: "Intermediate",
    question: "How does regenerative braking blend with hydraulic friction braking in hybrid and battery electric vehicles?",
    keyConcepts: ["Braking Torque Distribution", "Motor as Generator", "Brake-by-Wire Actuation", "Braking Feel"],
    hint: "Detail prioritizing motor regeneration for energy recovery while seamlessly modulating hydraulic calipers when braking demand exceeds motor capacity.",
  },
  {
    id: 804,
    field: "Automobile Engineering",
    difficulty: "Intermediate",
    question: "How does Controller Area Network (CAN) bus protocol manage priority arbitration and fault confinement in vehicle electronic control units (ECUs)?",
    keyConcepts: ["CAN ID Arbitration", "Dominant vs Recessive Bits", "Differential Signaling", "Bus Off State"],
    hint: "Explain non-destructive bitwise arbitration where lowest message ID takes priority, and node error counters for fault isolation.",
  },
  {
    id: 805,
    field: "Automobile Engineering",
    difficulty: "Advanced",
    question: "How do you design a high-voltage Battery Thermal Management System (BTMS) to prevent thermal runaway in lithium-ion battery packs under fast charging?",
    keyConcepts: ["Liquid Cold Plates", "Cell Degradation / SEI Layer", "Thermal Runaway Cascading", "Phase Change Materials"],
    hint: "Detail heat generation modeling (Joule heating + entropic heat), flow distribution across cooling channels, and thermal insulation barriers.",
  },
  {
    id: 806,
    field: "Automobile Engineering",
    difficulty: "Advanced",
    question: "How do vehicle chassis engineers optimize ride and handling compromises using Active Suspension (CDC dampers) and Anti-Roll Bar tuning?",
    keyConcepts: ["Quarter-Car Model", "Body Roll & Pitch Control", "Sprung vs Unsprung Mass", "Damper Skyhook Algorithm"],
    hint: "Explain balancing wheel hop control with passenger isolation and variable damping curves based on real-time road surface sensors.",
  },

  // ==========================================
  // 9. PRODUCTION / MANUFACTURING
  // ==========================================
  {
    id: 901,
    field: "Production / Manufacturing",
    difficulty: "Basic",
    question: "What are the core differences between sand casting, die casting, and investment casting, and what dictates the selection of each?",
    keyConcepts: ["Tooling Cost", "Surface Finish & Tolerances", "Production Volume", "Part Complexity"],
    hint: "Compare low tooling costs/rough finish of sand casting against high-volume precision die casting and intricate wax investment casting.",
  },
  {
    id: 902,
    field: "Production / Manufacturing",
    difficulty: "Basic",
    question: "What is Lean Manufacturing, and how do you identify the 7 classic forms of manufacturing waste (Muda)?",
    keyConcepts: ["Overproduction", "Waiting", "Transport", "Inventory", "Motion", "Over-processing", "Defects"],
    hint: "Define non-value-added activities and walk through eliminating bottlenecks in plant floor layouts.",
  },
  {
    id: 903,
    field: "Production / Manufacturing",
    difficulty: "Intermediate",
    question: "How do you calculate Overall Equipment Effectiveness (OEE) and use it to identify root causes of manufacturing downtime?",
    keyConcepts: ["Availability Rate", "Performance Rate", "Quality Rate", "OEE = A x P x Q"],
    hint: "Break down planned vs actual production time, micro-stops/speed loss, and scrap rates to achieve benchmark world-class OEE (85%+).",
  },
  {
    id: 904,
    field: "Production / Manufacturing",
    difficulty: "Intermediate",
    question: "How do you calculate Process Capability Indices (Cp and Cpk) to evaluate whether a machining process meets customer specification limits?",
    keyConcepts: ["Upper & Lower Spec Limits", "Standard Deviation (Sigma)", "Process Centering", "Cpk >= 1.33"],
    hint: "Explain Cp measuring spread relative to tolerance and Cpk measuring how well the process mean is centered between spec limits.",
  },
  {
    id: 905,
    field: "Production / Manufacturing",
    difficulty: "Advanced",
    question: "How do you implement a robust Failure Mode and Effects Analysis (Design & Process FMEA) and prioritize corrective actions using Risk Priority Numbers (RPN)?",
    keyConcepts: ["Severity", "Occurrence", "Detection", "Action Priority (AP) Tables"],
    hint: "Explain assigning ratings for failure severity, probability of occurrence, and detectability to implement poka-yoke error proofing.",
  },
  {
    id: 906,
    field: "Production / Manufacturing",
    difficulty: "Advanced",
    question: "How do you optimize an automated assembly line balancing problem under fluctuating customer Takt time and mixed-model production?",
    keyConcepts: ["Line Balancing Efficiency", "Cycle Time vs Takt Time", "Heijunka Production Leveling", "WIP Buffers"],
    hint: "Detail precedence diagram mapping, reallocating work element tasks, and sizing intermediate decoupling buffers.",
  },

  // ==========================================
  // 10. BIOTECHNOLOGY / BIOMEDICAL
  // ==========================================
  {
    id: 1001,
    field: "Biotechnology / Biomedical",
    difficulty: "Basic",
    question: "What is Polymerase Chain Reaction (PCR), and how do denaturation, annealing, and extension thermal cycles amplify specific DNA sequences?",
    keyConcepts: ["Taq Polymerase", "Thermal Cycler Stages", "Primer Specificity", "Exponential Amplification"],
    hint: "Explain DNA melting at 95°C, primer binding at 55-65°C, and complementary strand synthesis at 72°C.",
  },
  {
    id: 1002,
    field: "Biotechnology / Biomedical",
    difficulty: "Basic",
    question: "What is the working principle of enzymatic biosensors, such as electrochemical blood glucose test strips?",
    keyConcepts: ["Glucose Oxidase", "Electron Mediators", "Amperometric Detection", "Current Proportionality"],
    hint: "Explain enzymatic oxidation of glucose generating electrons transferred via a mediator to an electrode for current measurement.",
  },
  {
    id: 1003,
    field: "Biotechnology / Biomedical",
    difficulty: "Intermediate",
    question: "How do you scale up a stirred-tank bioreactor for mammalian cell cultures while maintaining the volumetric oxygen mass transfer coefficient (kLa) without excessive shear stress?",
    keyConcepts: ["Impeller Tip Speed", "Power Per Unit Volume (P/V)", "Dissolved Oxygen (DO)", "Sparger Bubble Sizing"],
    hint: "Discuss balancing gas superficial velocity and agitation speed to avoid lysing fragile cell membranes lacking cell walls.",
  },
  {
    id: 1004,
    field: "Biotechnology / Biomedical",
    difficulty: "Intermediate",
    question: "What is the regulatory pathway (FDA 510(k) Premarket Notification vs PMA) for classifying and validating a new medical device?",
    keyConcepts: ["Substantial Equivalence", "Predicate Devices", "Class I, II, III Risk Levels", "ISO 13485 Standards"],
    hint: "Explain proving substantial equivalence to a predicate device for Class II (510k) versus rigorous clinical trials for Class III (PMA).",
  },
  {
    id: 1005,
    field: "Biotechnology / Biomedical",
    difficulty: "Advanced",
    question: "How do you design a multi-step downstream purification process for monoclonal antibodies (mAbs) to clear host cell proteins (HCP) and viruses?",
    keyConcepts: ["Protein A Affinity Chromatography", "Ion-Exchange Chromatography", "Viral Inactivation (Low pH)", "Ultrafiltration/Diafiltration"],
    hint: "Walk through primary capture, virus reduction filters, polishing ion exchange columns, and final sterile formulation.",
  },
  {
    id: 1006,
    field: "Biotechnology / Biomedical",
    difficulty: "Advanced",
    question: "How do CRISPR-Cas9 ribonucleoprotein complexes achieve targeted double-strand breaks, and what strategies minimize off-target cleavage in therapeutic applications?",
    keyConcepts: ["Guide RNA (gRNA)", "Protospacer Adjacent Motif (PAM)", "High-Fidelity Cas9 Variants", "NHEJ vs HDR Repair"],
    hint: "Explain PAM recognition, using modified engineered Cas9 enzymes, and deep-sequencing off-target validation assays.",
  },

  // ==========================================
  // 11. AEROSPACE ENGINEERING
  // ==========================================
  {
    id: 1101,
    field: "Aerospace Engineering",
    difficulty: "Basic",
    question: "How do aerofoils generate aerodynamic lift, and what are the limitations of explaining lift solely using Bernoulli's principle versus Newton's third law?",
    keyConcepts: ["Pressure Differential", "Circulation & Downwash", "Angle of Attack", "Boundary Layer"],
    hint: "Discuss flow turning, pressure gradients created by curved streamlines, and net downward momentum transferred to the air mass.",
  },
  {
    id: 1102,
    field: "Aerospace Engineering",
    difficulty: "Basic",
    question: "What are the key differences between turbojet, turbofan, and turboprop aircraft propulsion engines?",
    keyConcepts: ["Bypass Ratio", "Propulsive Efficiency", "Specific Fuel Consumption (SFC)", "Mach Flight Regimes"],
    hint: "Explain how high-bypass turbofans achieve superior fuel efficiency for subsonic airliners while turbojets suit high-speed supersonic regimes.",
  },
  {
    id: 1103,
    field: "Aerospace Engineering",
    difficulty: "Intermediate",
    question: "How does aerodynamic stall occur, and what design features (e.g., wing twist, slats, vortex generators) prevent abrupt stall propagation?",
    keyConcepts: ["Boundary Layer Separation", "Critical Angle of Attack (Alpha)", "Washout / Geometric Twist", "High-Lift Devices"],
    hint: "Explain adverse pressure gradients causing flow separation from trailing edge forward and ensuring wing root stalls before wingtips.",
  },
  {
    id: 1104,
    field: "Aerospace Engineering",
    difficulty: "Intermediate",
    question: "How do you calculate delta-V and orbital transfer mechanics for a Hohmann transfer between two coplanar circular orbits?",
    keyConcepts: ["Vis-Viva Equation", "Semi-Major Axis", "Periapsis & Apoapsis Burns", "Specific Orbital Energy"],
    hint: "Walk through the two instantaneous tangential impulsive burns required to enter and exit an elliptical transfer trajectory.",
  },
  {
    id: 1105,
    field: "Aerospace Engineering",
    difficulty: "Advanced",
    question: "How do you analyze and suppress aeroelastic flutter in high-aspect-ratio aircraft wings and control surfaces?",
    keyConcepts: ["Torsional vs Bending Coupling", "Flutter Velocity (Vf)", "Mass Balancing", "Aeroelastic Tailoring"],
    hint: "Explain self-excited oscillations when aerodynamic forces feed into structural elastic modes, and placing mass forward of the elastic axis.",
  },
  {
    id: 1106,
    field: "Aerospace Engineering",
    difficulty: "Advanced",
    question: "Detail the thermodynamic and structural challenges of atmospheric re-entry thermal protection systems (TPS) during hypersonic deceleration.",
    keyConcepts: ["Stagnation Point Shockwave", "Ablative vs Reusable TPS (RCC)", "Radiative Heat Transfer", "Plasma Sheath"],
    hint: "Explain blunt body aerodynamics pushing bow shockwave away, ablative resin pyrolysis, and ceramic tile insulation.",
  },

  // ==========================================
  // 12. BUSINESS / MANAGEMENT
  // ==========================================
  {
    id: 1201,
    field: "Business / Management",
    difficulty: "Basic",
    question: "What is a SWOT analysis, and how do you transform qualitative SWOT matrices into actionable strategic business initiatives?",
    keyConcepts: ["Strengths, Weaknesses, Opportunities, Threats", "TOWS Matrix", "Internal vs External Factors"],
    hint: "Explain pairing internal strengths with external opportunities (SO strategies) and mitigating weaknesses against threats (WT strategies).",
  },
  {
    id: 1202,
    field: "Business / Management",
    difficulty: "Basic",
    question: "What is the difference between OKRs (Objectives and Key Results) and KPIs (Key Performance Indicators)?",
    keyConcepts: ["Strategic Ambition vs Operational Health", "Measurable Milestones", "Leading vs Lagging Indicators"],
    hint: "Define KPIs as ongoing health metrics (e.g., uptime, CAC) and OKRs as quarterly ambitious outcome-focused goals.",
  },
  {
    id: 1203,
    field: "Business / Management",
    difficulty: "Intermediate",
    question: "How do you navigate conflicting priorities and manage expectations when multiple senior executive stakeholders demand urgent deliverables?",
    keyConcepts: ["Stakeholder Mapping (Power-Interest Matrix)", "Impact vs Effort Prioritization", "Data-Driven Transparency"],
    hint: "Use objective prioritization criteria, communicate trade-offs openly, and align commitments with broader corporate strategy.",
  },
  {
    id: 1204,
    field: "Business / Management",
    difficulty: "Intermediate",
    question: "Describe your framework for managing organizational change and overcoming employee resistance during a major system migration.",
    keyConcepts: ["Kotter's 8-Step Change Model", "Stakeholder Communication", "Training & Enablement", "Quick Wins"],
    hint: "Establish urgency, build a guiding coalition, communicate the vision, remove roadblocks, and institutionalize new workflows.",
  },
  {
    id: 1205,
    field: "Business / Management",
    difficulty: "Advanced",
    question: "How do you evaluate potential Mergers & Acquisitions (M&A) targets and ensure successful post-merger operational integration?",
    keyConcepts: ["Strategic Fit", "Synergy Realization (Cost & Revenue)", "Cultural Integration", "Due Diligence"],
    hint: "Detail commercial/financial due diligence, identifying cultural friction points, and tracking realized synergy milestones over 12-24 months.",
  },
  {
    id: 1206,
    field: "Business / Management",
    difficulty: "Advanced",
    question: "How do you structure capital allocation decisions across core mature business lines versus high-risk exploratory R&D ventures?",
    keyConcepts: ["Three Horizons Framework", "Portfolio Risk-Return", "Real Options Valuation", "CapEx Governance"],
    hint: "Explain Horizon 1 (core cash cows), Horizon 2 (emerging growth), and Horizon 3 (disruptive bets) resource allocation percentages.",
  },

  // ==========================================
  // 13. FINANCE / ACCOUNTING
  // ==========================================
  {
    id: 1301,
    field: "Finance / Accounting",
    difficulty: "Basic",
    question: "How do the three primary financial statements (Income Statement, Balance Sheet, Cash Flow Statement) link together?",
    keyConcepts: ["Net Income Flow", "Working Capital Changes", "Retained Earnings", "Ending Cash Balance"],
    hint: "Walk through Net Income from P&L flowing to Cash Flow from Operations, adjusting for non-cash items, and ending cash balancing the balance sheet.",
  },
  {
    id: 1302,
    field: "Finance / Accounting",
    difficulty: "Basic",
    question: "What is working capital, and why can a company be highly profitable on paper yet suffer from a severe cash flow crisis?",
    keyConcepts: ["Current Assets - Current Liabilities", "Cash Conversion Cycle", "Accounts Receivable Collection", "Inventory Buildup"],
    hint: "Explain revenue recognition accruals versus actual cash collection delays and supplier payment timing.",
  },
  {
    id: 1303,
    field: "Finance / Accounting",
    difficulty: "Intermediate",
    question: "How do you construct a Discounted Cash Flow (DCF) valuation model, and how do you estimate the Weighted Average Cost of Capital (WACC)?",
    keyConcepts: ["Free Cash Flow to Firm (FCFF)", "Cost of Equity (CAPM)", "Cost of Debt", "Terminal Value (Gordon Growth vs Exit Multiple)"],
    hint: "Detail forecasting unlevered free cash flows, discounting with after-tax WACC, and sensitivity analysis across discount and growth rates.",
  },
  {
    id: 1304,
    field: "Finance / Accounting",
    difficulty: "Intermediate",
    question: "What is the difference between Net Present Value (NPV) and Internal Rate of Return (IRR), and why is NPV considered superior for mutually exclusive projects?",
    keyConcepts: ["Discounted Cash Flows", "Reinvestment Rate Assumption", "Scale Discrepancies", "Hurdle Rate"],
    hint: "Explain IRR's unrealistic assumption of reinvesting cash flows at IRR rather than cost of capital and potential multiple IRR solutions.",
  },
  {
    id: 1305,
    field: "Finance / Accounting",
    difficulty: "Advanced",
    question: "How do multinational enterprises structure financial risk hedging strategies against foreign currency exchange volatility and interest rate fluctuations?",
    keyConcepts: ["Forward Contracts & FX Swaps", "Option Collars", "Natural Hedging", "Hedge Accounting (IFRS 9 / ASC 815)"],
    hint: "Discuss matching revenue and expense currencies, cost-effective derivative overlays, and documentation for hedge effectiveness.",
  },
  {
    id: 1306,
    field: "Finance / Accounting",
    difficulty: "Advanced",
    question: "How do you evaluate and implement debt refinancing structures (Leveraged Buyouts, Mezzanine Debt, High-Yield Bonds) while maintaining debt covenants?",
    keyConcepts: ["Debt-to-EBITDA Ratios", "Interest Coverage Ratio (DSCR)", "Senior vs Subordinated Debt", "Refinancing Risk"],
    hint: "Detail stress testing liquidity under severe downside revenue contractions to ensure debt covenant compliance.",
  },

  // ==========================================
  // 14. MARKETING / SALES
  // ==========================================
  {
    id: 1401,
    field: "Marketing / Sales",
    difficulty: "Basic",
    question: "What are the 4 Ps of Marketing (Product, Price, Place, Promotion), and how do you align them for a new product launch?",
    keyConcepts: ["Marketing Mix", "Value Proposition", "Distribution Channels", "Pricing Strategies"],
    hint: "Explain how product differentiation, pricing tier (penetration vs premium), placement channels, and promotional messaging form a cohesive campaign.",
  },
  {
    id: 1402,
    field: "Marketing / Sales",
    difficulty: "Basic",
    question: "How do you calculate and interpret Customer Acquisition Cost (CAC) versus Customer Lifetime Value (LTV)?",
    keyConcepts: ["LTV:CAC Ratio (Target 3:1)", "Payback Period", "Churn Rate", "Sales & Marketing Spend"],
    hint: "Explain dividing sales/marketing expenses by new customers acquired, and comparing against gross margin generated over customer lifetime.",
  },
  {
    id: 1403,
    field: "Marketing / Sales",
    difficulty: "Intermediate",
    question: "How do you design a multi-channel inbound demand generation funnel, and what metrics do you track at each conversion stage?",
    keyConcepts: ["TOFU / MOFU / BOFU", "MQL to SQL Conversion", "Content Marketing", "Lead Scoring"],
    hint: "Walk through awareness content, gated assets, automated lead nurturing workflows, and sales handoff criteria.",
  },
  {
    id: 1404,
    field: "Marketing / Sales",
    difficulty: "Intermediate",
    question: "In complex B2B enterprise sales cycles, how do you navigate multi-stakeholder buying committees using frameworks like MEDDIC or BANT?",
    keyConcepts: ["Economic Buyer Identification", "Decision Criteria & Process", "Pain Point Quantification", "Champion Building"],
    hint: "Explain securing internal champions, mapping budget approval chains, and calculating ROI justification for the CFO.",
  },
  {
    id: 1405,
    field: "Marketing / Sales",
    difficulty: "Advanced",
    question: "How do you design a data-driven multi-touch attribution model to accurately allocate marketing budgets across paid, organic, and event channels?",
    keyConcepts: ["First-Touch vs Last-Touch", "Linear / Time-Decay Attribution", "Algorithmic / Shapley Value Attribution", "Marketing Mix Modeling (MMM)"],
    hint: "Discuss overcoming cookie deprecation, blending bottom-up clickstream attribution with top-down econometric MMM regression.",
  },
  {
    id: 1406,
    field: "Marketing / Sales",
    difficulty: "Advanced",
    question: "How do you manage sales team quota setting, compensation plan engineering, and pipeline velocity acceleration during high-growth scaling?",
    keyConcepts: ["Pipeline Velocity (Opportunities x Win Rate x Deal Size / Cycle Length)", "Commission Accelerators", "Ramp Time"],
    hint: "Explain aligning incentives with gross retention, designing tiered commission accelerators, and improving sales enablement.",
  },

  // ==========================================
  // 15. HUMAN RESOURCES
  // ==========================================
  {
    id: 1501,
    field: "Human Resources",
    difficulty: "Basic",
    question: "What is structured behavioral interviewing, and how does the STAR (Situation, Task, Action, Result) method evaluate candidate competencies?",
    keyConcepts: ["Standardized Scoring Rubrics", "Past Performance as Predictor", "STAR Framework", "Bias Reduction"],
    hint: "Explain asking uniform competency-based questions and scoring candidates against standardized behavioral anchors.",
  },
  {
    id: 1502,
    field: "Human Resources",
    difficulty: "Basic",
    question: "What are the essential elements of an effective employee onboarding program to accelerate time-to-productivity?",
    keyConcepts: ["30-60-90 Day Milestones", "Buddy System", "Cultural Integration", "Compliance & Tool Setup"],
    hint: "Discuss pre-boarding communication, clear role expectations, cross-functional introductions, and ongoing check-in cadences.",
  },
  {
    id: 1503,
    field: "Human Resources",
    difficulty: "Intermediate",
    question: "How do you facilitate conflict resolution and formal workplace mediation between colleagues or managers constructively?",
    keyConcepts: ["Active Listening", "Root Cause Discovery", "Non-Violent Communication", "Actionable Resolution Plans"],
    hint: "Detail establishing neutral ground, identifying underlying interests rather than surface positions, and documenting agreed mutual commitments.",
  },
  {
    id: 1504,
    field: "Human Resources",
    difficulty: "Intermediate",
    question: "How do you design a progressive performance management system that moves beyond annual appraisals to continuous feedback and OKR coaching?",
    keyConcepts: ["Continuous Feedback Cadences", "360-Degree Reviews", "Performance Improvement Plans (PIP)", "Talent Development"],
    hint: "Explain monthly developmental 1-on-1s, separating compensation discussions from coaching, and objective evaluation rubrics.",
  },
  {
    id: 1505,
    field: "Human Resources",
    difficulty: "Advanced",
    question: "How do you formulate an enterprise talent retention and succession planning strategy to protect critical leadership and specialized technical roles?",
    keyConcepts: ["9-Box Grid Assessment", "Flight Risk Predictors", "High-Potential (HiPo) Development", "Emergency vs Long-Term Succession"],
    hint: "Discuss identifying single-point-of-failure roles, mentorship rotation programs, and competitive compensation benchmarking.",
  },
  {
    id: 1506,
    field: "Human Resources",
    difficulty: "Advanced",
    question: "How do you design and govern an equitable total rewards and compensation philosophy (salary bands, equity, benefits) in a competitive talent market?",
    keyConcepts: ["Comp-Ratio Analysis", "Market Benchmarking (Radford/Mercer)", "Pay Equity Audits", "Job Architecture"],
    hint: "Explain constructing geographic pay differentials, maintaining internal equity, and conducting regular demographic pay audits.",
  },

  // ==========================================
  // 16. DESIGN
  // ==========================================
  {
    id: 1601,
    field: "Design",
    difficulty: "Basic",
    question: "What is the difference between User Interface (UI) design and User Experience (UX) design, and how do they collaborate?",
    keyConcepts: ["Visual Aesthetics vs Information Architecture", "User Empathy", "Wireframing & Prototyping"],
    hint: "Explain how UX focuses on user journeys, usability, and problem solving, while UI focuses on visual hierarchy, typography, and interactive elements.",
  },
  {
    id: 1602,
    field: "Design",
    difficulty: "Basic",
    question: "How do visual hierarchy, contrast ratios, and typography scale create intuitive readability in digital interfaces?",
    keyConcepts: ["Typographic Scales", "Gestalt Principles (Proximity, Similarity)", "Visual Weight & Whitespace"],
    hint: "Explain guiding the user's eye naturally through size contrast, color prominence, and consistent spacing systems.",
  },
  {
    id: 1603,
    field: "Design",
    difficulty: "Intermediate",
    question: "How do you conduct usability testing and apply Nielsen's 10 Usability Heuristics to identify interaction friction?",
    keyConcepts: ["Think-Aloud Protocol", "Visibility of System Status", "Error Prevention & Recovery", "Task Completion Rates"],
    hint: "Detail user session observation, synthesizing task completion metrics, and categorizing usability flaws.",
  },
  {
    id: 1604,
    field: "Design",
    difficulty: "Intermediate",
    question: "How do you build and maintain a scalable Design System using Atomic Design methodology and design tokens?",
    keyConcepts: ["Atoms, Molecules, Organisms", "Design Tokens (Color, Spacing, Typography)", "Component Libraries in Figma"],
    hint: "Discuss synchronized component governance between Figma and engineering UI libraries to maintain consistency.",
  },
  {
    id: 1605,
    field: "Design",
    difficulty: "Advanced",
    question: "How do you ensure enterprise software strictly complies with Web Content Accessibility Guidelines (WCAG 2.1 Level AA) across complex interactive widgets?",
    keyConcepts: ["Color Contrast (4.5:1)", "ARIA Attributes & Screen Readers", "Keyboard Navigation Focus Rings", "Semantic HTML"],
    hint: "Explain automated and manual assistive technology testing, skip links, managing focus traps in modals, and accessible color palettes.",
  },
  {
    id: 1606,
    field: "Design",
    difficulty: "Advanced",
    question: "How do you lead user research to uncover latent customer needs and translate qualitative journey maps into high-impact product architecture?",
    keyConcepts: ["Jobs-to-be-Done (JTBD) Framework", "Generative Research", "Service Blueprints", "Mental Models"],
    hint: "Detail conducting ethnographic interviews, synthesizing thematic affinity maps, and mapping frontstage user actions to backstage systems.",
  },

  // ==========================================
  // 17. HEALTHCARE
  // ==========================================
  {
    id: 1701,
    field: "Healthcare",
    difficulty: "Basic",
    question: "What is the primary purpose of the patient triage process, and how are vital signs utilized to prioritize care in clinical settings?",
    keyConcepts: ["Emergency Severity Index (ESI)", "Vital Signs Interpretation", "Acuity Prioritization"],
    hint: "Explain assessing airway, breathing, circulation, and vital sign thresholds to treat life-threatening conditions immediately.",
  },
  {
    id: 1702,
    field: "Healthcare",
    difficulty: "Basic",
    question: "What are the core principles of HIPAA (Health Insurance Portability and Accountability Act) regarding Protected Health Information (PHI)?",
    keyConcepts: ["Minimum Necessary Standard", "Privacy & Security Rules", "Patient Consent & Disclosure"],
    hint: "Discuss physical, technical, and administrative safeguards to ensure confidential transmission and storage of patient medical records.",
  },
  {
    id: 1703,
    field: "Healthcare",
    difficulty: "Intermediate",
    question: "How do structured clinical communication protocols like SBAR (Situation, Background, Assessment, Recommendation) prevent medical handoff errors?",
    keyConcepts: ["Standardized Handoffs", "Patient Safety", "Inter-professional Collaboration"],
    hint: "Walk through succinctly delivering current clinical status, relevant patient history, objective findings, and actionable recommendations.",
  },
  {
    id: 1704,
    field: "Healthcare",
    difficulty: "Intermediate",
    question: "What infection prevention and control protocols (standard precautions vs transmission-based isolation) are essential in clinical settings?",
    keyConcepts: ["Hand Hygiene", "Contact, Droplet, Airborne Isolation", "Personal Protective Equipment (PPE)"],
    hint: "Explain negative pressure rooms for airborne pathogens, sterile donning/doffing procedures, and preventing nosocomial infections.",
  },
  {
    id: 1705,
    field: "Healthcare",
    difficulty: "Advanced",
    question: "How do healthcare organizations implement Clinical Decision Support Systems (CDSS) and evidence-based clinical pathways without triggering alert fatigue?",
    keyConcepts: ["Evidence-Based Medicine", "Alert Fatigue Mitigation", "EHR Workflow Integration", "Diagnostic Safety"],
    hint: "Explain tiered alert severity, context-sensitive clinical rules, and evaluating clinical outcome improvements.",
  },
  {
    id: 1706,
    field: "Healthcare",
    difficulty: "Advanced",
    question: "How do you lead a multidisciplinary Root Cause Analysis (RCA) following a sentinel event or near-miss in a hospital environment?",
    keyConcepts: ["Just Culture Framework", "Fishbone / 5 Whys Analysis", "Systemic vs Human Factors", "Action Plans & Audits"],
    hint: "Focus on systemic vulnerabilities rather than individual blame, formulating engineering safeguards, and monitoring safety metrics.",
  },

  // ==========================================
  // 18. RESEARCH
  // ==========================================
  {
    id: 1801,
    field: "Research",
    difficulty: "Basic",
    question: "What is the difference between qualitative and quantitative research methodologies, and when is each most appropriate?",
    keyConcepts: ["Exploratory vs Confirmatory", "Statistical Analysis vs Thematic Coding", "Mixed-Methods Approach"],
    hint: "Explain quantitative research measuring numerical relationships and hypotheses versus qualitative exploring motivations and meanings.",
  },
  {
    id: 1802,
    field: "Research",
    difficulty: "Basic",
    question: "What is the difference between statistical significance (p-value < 0.05) and practical significance (effect size)?",
    keyConcepts: ["Null Hypothesis Testing", "Type I and Type II Errors", "Effect Size (Cohen's d)", "Sample Size Dependency"],
    hint: "Explain how very large sample sizes can yield statistically significant p-values for negligible real-world effects.",
  },
  {
    id: 1803,
    field: "Research",
    difficulty: "Intermediate",
    question: "How do you identify and control for confounding variables and selection bias in experimental design?",
    keyConcepts: ["Randomized Controlled Trials (RCT)", "Blinding (Single vs Double)", "Stratification & Covariate Adjustment"],
    hint: "Discuss random assignment, matching, control groups, and multivariable regression modeling to isolate causal relationships.",
  },
  {
    id: 1804,
    field: "Research",
    difficulty: "Intermediate",
    question: "What are the ethical requirements for conducting human subjects research, and what is the role of an Institutional Review Board (IRB)?",
    keyConcepts: ["Belmont Report Principles (Autonomy, Beneficence, Justice)", "Informed Consent", "Vulnerable Populations"],
    hint: "Explain evaluating risk-benefit ratios, protecting participant privacy, and obtaining voluntary documented consent.",
  },
  {
    id: 1805,
    field: "Research",
    difficulty: "Advanced",
    question: "How do you design a reproducible research data management pipeline adhering to the FAIR (Findable, Accessible, Interoperable, Reusable) data principles?",
    keyConcepts: ["Open Science", "Version-Controlled Code & Data", "Containerization (Docker)", "Metadata Standards"],
    hint: "Detail persistent identifiers (DOIs), code repositories, standard ontologies, and documentation for third-party validation.",
  },
  {
    id: 1806,
    field: "Research",
    difficulty: "Advanced",
    question: "How do you navigate systemic publication bias and the reproducibility crisis when conducting systematic reviews and meta-analyses?",
    keyConcepts: ["Funnel Plot Asymmetry (Egger's Test)", "Pre-Registration of Studies", "Heterogeneity (I-squared)", "Sensitivity Analysis"],
    hint: "Explain identifying missing unpublished negative studies, evaluating study quality weights, and running sub-group sensitivity analyses.",
  },

  // ==========================================
  // 19. EDUCATION
  // ==========================================
  {
    id: 1901,
    field: "Education",
    difficulty: "Basic",
    question: "What is the difference between formative assessment and summative assessment in evaluating student learning?",
    keyConcepts: ["Assessment for Learning vs Assessment of Learning", "Low-Stakes Feedback", "Curriculum Mastery"],
    hint: "Compare continuous informal feedback during learning (quizzes, check-ins) against end-of-unit evaluations (final exams, projects).",
  },
  {
    id: 1902,
    field: "Education",
    difficulty: "Basic",
    question: "How do you apply Bloom's Revised Taxonomy to formulate progressive learning objectives across cognitive levels?",
    keyConcepts: ["Remember, Understand, Apply, Analyze, Evaluate, Create", "Action Verbs", "Scaffolding"],
    hint: "Explain guiding students from foundational recall to higher-order critical evaluation and creative synthesis.",
  },
  {
    id: 1903,
    field: "Education",
    difficulty: "Intermediate",
    question: "How do you implement differentiated instruction in a diverse classroom with varying academic readiness and learning needs?",
    keyConcepts: ["Tiered Activities", "Universal Design for Learning (UDL)", "Flexible Grouping", "Multimodal Content"],
    hint: "Discuss adapting content, process, and products to support both struggling students and advanced learners without lowering standards.",
  },
  {
    id: 1904,
    field: "Education",
    difficulty: "Intermediate",
    question: "What proactive classroom management strategies create an inclusive, psychologically safe, and productive learning environment?",
    keyConcepts: ["Clear Norms & Expectations", "Positive Behavioral Interventions", "De-escalation Techniques", "Student Agency"],
    hint: "Focus on establishing consistent routines, building empathetic student relationships, and addressing minor disruptions proactively.",
  },
  {
    id: 1905,
    field: "Education",
    difficulty: "Advanced",
    question: "How do you utilize educational technology and learning analytics data to identify early-warning drop-off trends and adapt pedagogy?",
    keyConcepts: ["Learning Management System (LMS) Telemetry", "Data-Informed Pedagogy", "Intervention Workflows", "Adaptive Learning"],
    hint: "Explain analyzing time-on-task, submission consistency, and formative data to deliver targeted instructional interventions.",
  },
  {
    id: 1906,
    field: "Education",
    difficulty: "Advanced",
    question: "How do you lead curriculum development and accreditation review aligned with rigorous institutional and industry standards?",
    keyConcepts: ["Backward Design (Wiggins & McTighe)", "Constructive Alignment", "Program Learning Outcomes (PLOs)", "Continuous Improvement"],
    hint: "Explain starting with desired terminal outcomes, deriving assessment evidence, and designing instructional units with stakeholder feedback.",
  },

  // ==========================================
  // 20. UNIVERSAL / OTHER
  // ==========================================
  {
    id: 2001,
    field: "Other",
    difficulty: "Basic",
    question: "Describe your systematic approach to breaking down and solving an unfamiliar technical or operational problem.",
    keyConcepts: ["Problem Decomposition", "First Principles Thinking", "Iterative Validation"],
    hint: "Explain defining the problem boundary, gathering facts, forming hypotheses, testing solutions, and documenting findings.",
  },
  {
    id: 2002,
    field: "Other",
    difficulty: "Basic",
    question: "How do you prioritize competing deadlines and maintain quality standards when project resources are constrained?",
    keyConcepts: ["Urgency vs Importance Matrix", "Resource Allocation", "Quality Control Checks"],
    hint: "Discuss structured triage, transparent communication with stakeholders, and establishing non-negotiable quality checks.",
  },
  {
    id: 2003,
    field: "Other",
    difficulty: "Intermediate",
    question: "Describe a scenario where a project or plan did not go as expected. How did you adapt and what did you learn?",
    keyConcepts: ["STAR Method", "Agility & Resilience", "Root Cause Analysis", "Continuous Improvement"],
    hint: "Use Situation, Task, Action, Result. Highlight quick adaptation, pragmatic mitigation, and process enhancements.",
  },
  {
    id: 2004,
    field: "Other",
    difficulty: "Intermediate",
    question: "How do you communicate complex technical details and analytical conclusions to non-technical stakeholders effectively?",
    keyConcepts: ["Audience Adaptation", "Visual Summaries", "Focus on Impact & ROI", "Avoiding Jargon"],
    hint: "Explain distilling complexity into high-level business impacts, using analogies, and anchoring decisions in measurable outcomes.",
  },
  {
    id: 2005,
    field: "Other",
    difficulty: "Advanced",
    question: "How do you establish quantitative reliability targets and build operational redundancy into mission-critical workflows?",
    keyConcepts: ["Single Point of Failure (SPOF)", "Redundancy Design", "FMEA / Risk Analysis", "Incident Containment"],
    hint: "Discuss active-standby redundancy, failure mode mapping, automated health checks, and rapid recovery protocols.",
  },
  {
    id: 2006,
    field: "Other",
    difficulty: "Advanced",
    question: "Scenario: You discover a critical discrepancy in a deliverable just before delivery. How do you lead root cause analysis and resolution?",
    keyConcepts: ["Crisis Leadership", "Containment Actions", "Corrective & Preventative Actions (CAPA)", "Transparent Communication"],
    hint: "Outline immediate risk containment, systematic root cause isolation, technical fix validation, and stakeholder updates.",
  },
];

/**
/**
 * Helper to normalize experience level / difficulty strings
 */
function normalizeDifficulty(diff) {
  if (!diff) return "";
  const d = String(diff).toLowerCase();
  if (d.includes("basic") || d.includes("entry") || d.includes("fresher") || d.includes("junior") || d.includes("0-2")) return "Basic";
  if (d.includes("adv") || d.includes("senior") || d.includes("lead") || d.includes("expert") || d.includes("5+")) return "Advanced";
  if (d.includes("inter") || d.includes("mid") || d.includes("2-5")) return "Intermediate";
  return diff;
}

/**
 * Helper to normalize and match career fields
 */
function normalizeField(f) {
  if (!f) return "other";
  return String(f).trim().toLowerCase();
}

function matchesField(qField, targetField) {
  if (!targetField || targetField === "other" || targetField === "all fields") return true;
  const qF = qField.toLowerCase();
  const tF = targetField.toLowerCase();
  if (qF === tF) return true;
  const tParts = tF.split("/").map((p) => p.trim());
  const qParts = qF.split("/").map((p) => p.trim());
  return tParts.some((tp) => qParts.some((qp) => qp.includes(tp) || tp.includes(qp)));
}

/**
 * Get all questions matching a specific career field and optional difficulty tier
 */
export function getQuestionsByField(field, difficulty) {
  if (!field) return INTERVIEW_QUESTION_BANK;

  const normField = normalizeField(field);
  const normDiff = normalizeDifficulty(difficulty);

  return INTERVIEW_QUESTION_BANK.filter((q) => {
    const matchF = matchesField(q.field, normField);
    const matchD = normDiff ? normalizeDifficulty(q.difficulty) === normDiff : true;
    return matchF && matchD;
  });
}

/**
 * Select a random, unused question from the bank with graceful multi-tier fallbacks
 */
export function getRandomUnusedQuestion(field, difficulty, usedQuestions = []) {
  const safeUsed = Array.isArray(usedQuestions)
    ? usedQuestions.filter(Boolean).map((q) => (typeof q === "string" ? q.trim().toLowerCase() : ""))
    : [];

  const isUsed = (qText) => {
    if (!qText) return false;
    const cleanQ = qText.trim().toLowerCase();
    return safeUsed.some(
      (u) => u === cleanQ || (u.length > 30 && cleanQ.length > 30 && (u.includes(cleanQ) || cleanQ.includes(u)))
    );
  };

  const normField = normalizeField(field);
  const normDiff = normalizeDifficulty(difficulty);

  console.log(`[QUESTION_BANK] Querying bank for field: "${field}" (normalized: "${normField}"), diff: "${difficulty}" (normalized: "${normDiff}")`);
  console.log(`[QUESTION_BANK] Total questions in bank: ${INTERVIEW_QUESTION_BANK.length}, Total excluded: ${safeUsed.length}`);

  // Tier 1: Exact Field + Exact Difficulty
  let pool = INTERVIEW_QUESTION_BANK.filter((q) => {
    const matchF = matchesField(q.field, normField);
    const matchD = normDiff ? normalizeDifficulty(q.difficulty) === normDiff : true;
    return matchF && matchD && !isUsed(q.question);
  });

  console.log(`[QUESTION_BANK] Tier 1 (Field + Difficulty) pool size: ${pool.length}`);

  // Tier 2: Exact Field + Any Difficulty
  if (pool.length === 0) {
    pool = INTERVIEW_QUESTION_BANK.filter((q) => {
      const matchF = matchesField(q.field, normField);
      return matchF && !isUsed(q.question);
    });
    console.log(`[QUESTION_BANK] Tier 2 (Field + Any Difficulty) pool size: ${pool.length}`);
  }

  // Tier 3: Universal / Other Category
  if (pool.length === 0) {
    pool = INTERVIEW_QUESTION_BANK.filter((q) => {
      const matchOther = q.field === "Other";
      const matchD = normDiff ? normalizeDifficulty(q.difficulty) === normDiff : true;
      return matchOther && matchD && !isUsed(q.question);
    });
    console.log(`[QUESTION_BANK] Tier 3 (Other + Difficulty) pool size: ${pool.length}`);
  }

  // Tier 4: Any Unused Question across the entire bank
  if (pool.length === 0) {
    pool = INTERVIEW_QUESTION_BANK.filter((q) => !isUsed(q.question));
    console.log(`[QUESTION_BANK] Tier 4 (Entire Bank Unused) pool size: ${pool.length}`);
  }

  if (pool.length === 0) {
    console.warn(`[QUESTION_BANK] All questions in the entire bank (${INTERVIEW_QUESTION_BANK.length}) are exhausted!`);
    return null;
  }

  // Truly random selection among remaining candidates
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selected = pool[randomIndex];
  console.log(`[QUESTION_BANK] Selected question ID ${selected.id} [${selected.difficulty}]: "${selected.question.slice(0, 60)}..."`);
  return selected;
}
