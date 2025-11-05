// extension/rule-engine.js

/**
 * RuleEngine evaluates files against a set of rules to determine if they should be processed.
 * Rules are based on file extensions, MIME types, folder paths, and file size.
 * The evaluation precedence is: DENY > INCLUDE > SIZE.
 */
export class RuleEngine {
  constructor() {
    // A map of common file extensions to MIME types.
    this.mimeTypeMap = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      txt: "text/plain",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      zip: "application/zip",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      exe: "application/x-executable",
      bat: "application/x-bat",
      tmp: "application/x-temp",
    };
  }

  /**
   * Extracts the file extension from a file path.
   * @param {string} filePath - The path to the file.
   * @returns {string} The file extension in lowercase.
   */
  getExtension(filePath) {
    const match = filePath.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : "";
  }

  /**
   * Gets the MIME type for a given file extension.
   * @param {string} extension - The file extension.
   * @returns {string} The corresponding MIME type or a default.
   */
  getMimeType(extension) {
    return this.mimeTypeMap[extension] || "application/octet-stream";
  }

  /**
   * Matches a string against a pattern with wildcards (*, ?).
   * @param {string} text - The string to test.
   * @param {string} pattern - The pattern to match against.
   * @returns {boolean} True if the text matches the pattern.
   */
  matchesPattern(text, pattern) {
    if (!pattern) return false;
    // Escape regex characters and replace wildcards
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape all regex special chars
      .replace(/\*/g, ".*") // Replace * with .*
      .replace(/\?/g, "."); // Replace ? with .
    try {
      const regex = new RegExp(`^${regexPattern}$`, "i");
      return regex.test(text);
    } catch (e) {
      console.error("Invalid regex pattern:", pattern, e);
      return text.toLowerCase().includes(pattern.toLowerCase());
    }
  }

  /**
   * Checks if a file extension matches any of the provided patterns.
   * @param {string} extension - The file extension.
   * @param {string[]} patterns - An array of extension patterns.
   * @returns {boolean} True if a match is found.
   */
  matchesExtensionList(extension, patterns) {
    if (!patterns || patterns.length === 0) return false;
    return patterns.some((pattern) => {
      pattern = pattern.trim().toLowerCase();
      if (pattern.startsWith("*.")) {
        return this.matchesPattern(extension, pattern.substring(1)); // Keep the *
      }
      return this.matchesPattern(extension, pattern);
    });
  }

  /**
   * Checks if a MIME type matches any of the provided patterns.
   * @param {string} mimeType - The MIME type.
   * @param {string[]} patterns - An array of MIME type patterns.
   * @returns {boolean} True if a match is found.
   */
  matchesMimeTypeList(mimeType, patterns) {
    if (!patterns || patterns.length === 0) return false;
    return patterns.some((pattern) => {
      pattern = pattern.trim().toLowerCase();
      if (pattern.endsWith("/*")) {
        const baseType = pattern.slice(0, -1); // "image/*" -> "image/"
        return mimeType.toLowerCase().startsWith(baseType);
      }
      return this.matchesPattern(mimeType, pattern);
    });
  }

  /**
   * Checks if a file path matches any of the provided folder patterns.
   * @param {string} filePath - The full file path.
   * @param {string[]} patterns - An array of folder path patterns.
   * @returns {boolean} True if a match is found.
   */
  matchesFolderList(filePath, patterns) {
    if (!patterns || patterns.length === 0) return false;
    return patterns.some((pattern) =>
      this.matchesPattern(filePath, pattern.trim())
    );
  }

  /**
   * Evaluates a file against a set of rules.
   * @param {string} filePath - The name or path of the file.
   * @param {number} fileSizeMB - The size of the file in megabytes.
   * @param {object} rules - The rules object containing deny, include, and size properties.
   * @returns {{allowed: boolean, reason: string}} The evaluation result.
   */
  evaluateFile(filePath, fileSizeMB, rules) {
    const extension = this.getExtension(filePath);
    const mimeType = this.getMimeType(extension);

    // 1. Check DENY rules (highest precedence)
    if (rules.deny) {
      if (this.matchesExtensionList(extension, rules.deny.extensions)) {
        return {
          allowed: false,
          reason: `Denied by extension rule: ${extension}`,
        };
      }
      if (this.matchesMimeTypeList(mimeType, rules.deny.mimeTypes)) {
        return {
          allowed: false,
          reason: `Denied by MIME type rule: ${mimeType}`,
        };
      }
      if (this.matchesFolderList(filePath, rules.deny.folders)) {
        return {
          allowed: false,
          reason: `Denied by folder rule: path matches deny pattern`,
        };
      }
    }

    // 2. Check INCLUDE rules
    let includeMatch = false;
    let includeReason = "no include rules specified";
    const hasIncludeRules =
      rules.include &&
      ((rules.include.extensions && rules.include.extensions.length > 0) ||
        (rules.include.mimeTypes && rules.include.mimeTypes.length > 0) ||
        (rules.include.folders && rules.include.folders.length > 0));

    if (hasIncludeRules) {
      if (this.matchesExtensionList(extension, rules.include.extensions)) {
        includeMatch = true;
        includeReason = `extension ${extension}`;
      } else if (this.matchesMimeTypeList(mimeType, rules.include.mimeTypes)) {
        includeMatch = true;
        includeReason = `MIME type ${mimeType}`;
      } else if (this.matchesFolderList(filePath, rules.include.folders)) {
        includeMatch = true;
        includeReason = `folder pattern`;
      }

      if (!includeMatch) {
        return { allowed: false, reason: `Not included by any include rule` };
      }
    } else {
      // If no include rules, everything is implicitly included
      includeMatch = true;
    }

    // 3. Check SIZE rules (lowest precedence among checks)
    if (rules.size) {
      if (rules.size.min != null && fileSizeMB < rules.size.min) {
        return {
          allowed: false,
          reason: `File too small: ${fileSizeMB.toFixed(
            2
          )}MB < ${rules.size.min}MB`,
        };
      }
      if (rules.size.max != null && fileSizeMB > rules.size.max) {
        return {
          allowed: false,
          reason: `File too large: ${fileSizeMB.toFixed(
            2
          )}MB > ${rules.size.max}MB`,
        };
      }
    }

    return {
      allowed: true,
      reason: `Allowed: included by ${includeReason} and size is within limits`,
    };
  }
}
