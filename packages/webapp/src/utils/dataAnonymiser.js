/**
 * Anonymizes patient data using basic k-anonymity principles.
 * Removes direct identifiers and generalizes quasi-identifiers.
 *
 * @param {Object} data - Original patient data object
 * @returns {Object} - Anonymized patient data
 */
const dataAnonymiser = (data) => {
    // Generalize age to 10-year bins up to 100+
    const generalizeAge = (age) => {
        if (age < 0) return "Unknown";
        if (age >= 100) return "100+";
        const lower = Math.floor(age / 10) * 10;
        const upper = lower + 9;
        return `${lower}-${upper}`;
    };

    // Generalize gender (optionally normalize or hide)
    const generalizeGender = (gender) => {
        const normalized = gender?.toLowerCase();
        if (normalized === "male" || normalized === "female") return normalized;
        return "unspecified";
    };

    // Build anonymized object
    return {
        ageGroup: generalizeAge(data.age),
        gender: generalizeGender(data.gender),
        healthRecords: data.healthRecords,
        timestamp: data.timestamp.slice(0, 7), // Keep only year and month
    };
}

export default dataAnonymiser;