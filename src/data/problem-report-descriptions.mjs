// Plain-language descriptions for every kind and field of the problem report
// schema copy in public/schemas/problem-report/v1.json. The privacy page
// builds its data table from the schema and this map with
// src/lib/problem-report-table.mjs, which fails the build when a kind or a
// field has no description here, or when this map names one the schema lacks.
// Facts: frostyard/core docs/specs/problem-report.md and
// docs/adr/0069-report-problems-local-first-opt-in-with-one-sender-per-host.md.

export default {
  envelope: {
    schema: "The schema version of the report.",
    report_id: "A random ID, made new for each report. It links nothing else. Give it to us to have that report deleted.",
    week: "The ISO week the problem happened, or the week a count is sent. Never a date or a time.",
    "image.id": "Which image the computer runs.",
    "image.version": "The image version, a 14-digit build timestamp.",
    secure: "Whether the computer runs the secure-boot variant of the image.",
    client: "The program that sent the report and its version: ChairLift on desktops, snosi-health on Floe.",
    kind: "What kind of problem the report is about. Each kind is described below.",
  },
  kinds: {
    unit_failed: {
      title: "A system service failed",
      purpose: "Finds image services that break after an update. Only services that ship in the image are reported, never one you added.",
      fields: {
        unit: "The service name, with any instance part removed (user@1000.service becomes user@.service).",
        result: "How it failed.",
        shipped: "Always true: the service ships in the image.",
      },
    },
    update_stage_failed: {
      title: "An update could not be prepared",
      purpose: "Finds updates that never get ready to install.",
      fields: {
        target_version: "The image version the update tried to prepare.",
        error_class: "Why it failed, as a broad class.",
        bootc_version: "The version of bootc, the tool that prepares updates.",
      },
    },
    booted_older_image: {
      title: "The computer went back to an older image",
      purpose: "Finds updates that make people go back to the previous image.",
      fields: {
        newer_version: "The newer image version that was not kept.",
        how: "How the older image was chosen.",
      },
    },
    sysext_update_failed: {
      title: "A system extension update failed",
      purpose: "Finds system extensions that fail to update. Extensions you added yourself are never reported.",
      fields: {
        feature: "The extension name, from the image or the Frostyard catalog.",
        version: "The extension version.",
        outcome: "What happened to the update.",
        error_class: "Why it failed, as a broad class.",
      },
    },
    tpm_unlock: {
      title: "The disk did not unlock on the first try",
      purpose: "Finds releases that break automatic disk unlock with the TPM. A clean first-try unlock is not recorded.",
      fields: {
        outcome: "How the disk was unlocked in the end.",
        tpm_rc: "The TPM's reason for refusing, as a broad class.",
        retries: "How many retries it took, from 0 to 10.",
      },
    },
    integrity_error: {
      title: "A file integrity check failed",
      purpose: "Finds corrupted files or a bad build. File names are never sent.",
      fields: {
        subsystem: "Which integrity check failed.",
        count: "How many errors, in a range.",
      },
    },
    crash: {
      title: "A program crashed",
      purpose: "Not sent yet. The format defines crash reports, but the first releases that send reports keep crashes on your computer; a later release adds them. Then they will find crashes of programs in the image. Only programs under /usr will be reported; a crash of a Flatpak app stays on your computer. The core dump, the command line and the environment are never sent.",
      fields: {
        exe: "The program's file name without its folder.",
        package: "The Debian package that holds the program.",
        package_version: "The version of that package.",
        signal: "The signal that stopped the program.",
      },
    },
    app_problem: {
      title: "A Frostyard app hit an internal error",
      purpose: "Finds bugs in Frostyard's own apps. The error message stays on your computer.",
      fields: {
        app_id: "Which Frostyard app.",
        app_version: "The app's release version.",
        runtime: "The language the app part is written in.",
        component: "Which part of the app.",
        class: "A crash of the app (panic) or a known error.",
        code: "A fixed error code from the app's source, such as store.migrate_failed. Sent only for errors.",
        frames: "For a Go panic: up to 32 function names from Frostyard code, the Go standard library, and the go-imap fork that Frostmail uses. No file paths, no arguments. Other functions show as other.",
        location: "For a Rust panic: the source file and line in Frostyard's code, such as src/store.rs:42.",
      },
    },
    count: {
      title: "Weekly count",
      purpose: "Counts the users who turned reporting on (on Floe, the computer), to see which versions are in use and whether updates arrive. Sent at most once a week. Counts are approximate: 2 users who turn reporting on at 1 desktop count 2 times.",
      fields: {
        install_age: "How long ago the system was installed, in a range.",
        channel: "Whether the computer follows the latest image.",
      },
    },
  },
};
