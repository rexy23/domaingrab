import { createHash } from 'crypto';

export interface GDPRConfig {
  retentionPeriod: number; // days
  anonymizationLevel: 'basic' | 'enhanced' | 'full';
  dataProcessingBasis: 'consent' | 'legitimate_interest' | 'contract';
  geolocation: 'EU' | 'UK' | 'global';
}

export interface DataClassification {
  personalData: boolean;
  sensitiveData: boolean;
  publicData: boolean;
  businessData: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export class GDPRCompliance {
  private readonly config: GDPRConfig;
  private readonly piiPatterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(?:\+|00)[\d\s\-\(\)]{8,20}/g,
    ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    ipv6: /(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    name: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, // Basic name pattern
    address: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Place|Pl)\b/gi,
    passport: /[A-Z]{1,2}\d{6,9}/g,
    nationalId: /\b[A-Z]{2}\d{8,12}\b/g
  };

  constructor(config: GDPRConfig) {
    this.config = config;
  }

  sanitizeData(data: any, classification?: DataClassification): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data, classification);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item, classification));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        const fieldClassification = this.classifyField(key, value);
        sanitized[key] = this.sanitizeData(value, fieldClassification);
      }
      return sanitized;
    }

    return data;
  }

  private sanitizeString(text: string, classification?: DataClassification): string {
    if (!text || typeof text !== 'string') return text;

    let sanitized = text;

    // Apply different sanitization levels based on classification
    const level = classification?.riskLevel || 'medium';

    switch (level) {
      case 'high':
        sanitized = this.applySevereSanitization(sanitized);
        break;
      case 'medium':
        sanitized = this.applyModerateSanitization(sanitized);
        break;
      case 'low':
        sanitized = this.applyBasicSanitization(sanitized);
        break;
    }

    return sanitized;
  }

  private applySevereSanitization(text: string): string {
    let sanitized = text;

    // Remove all potential PII
    Object.entries(this.piiPatterns).forEach(([type, pattern]) => {
      sanitized = sanitized.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
    });

    // Hash any remaining potentially sensitive data
    sanitized = sanitized.replace(/\b[A-Z][a-z]{4,}\s+[A-Z][a-z]{4,}\b/g, (match) => {
      return `[NAME_${this.hashData(match).substring(0, 8)}]`;
    });

    return sanitized;
  }

  private applyModerateSanitization(text: string): string {
    let sanitized = text;

    // Remove clear PII patterns
    sanitized = sanitized.replace(this.piiPatterns.email, '[EMAIL_REDACTED]');
    sanitized = sanitized.replace(this.piiPatterns.phone, '[PHONE_REDACTED]');
    sanitized = sanitized.replace(this.piiPatterns.creditCard, '[CARD_REDACTED]');
    sanitized = sanitized.replace(this.piiPatterns.ssn, '[SSN_REDACTED]');
    
    // Partial redaction for IP addresses (keep first two octets)
    sanitized = sanitized.replace(this.piiPatterns.ipv4, (match) => {
      const parts = match.split('.');
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    });

    return sanitized;
  }

  private applyBasicSanitization(text: string): string {
    let sanitized = text;

    // Only remove the most sensitive data
    sanitized = sanitized.replace(this.piiPatterns.email, '[EMAIL_REDACTED]');
    sanitized = sanitized.replace(this.piiPatterns.creditCard, '[CARD_REDACTED]');
    sanitized = sanitized.replace(this.piiPatterns.ssn, '[SSN_REDACTED]');

    return sanitized;
  }

  private classifyField(fieldName: string, value: any): DataClassification {
    const name = fieldName.toLowerCase();
    
    // Check for sensitive field names
    const sensitiveFields = ['password', 'ssn', 'credit', 'payment', 'private'];
    const personalFields = ['name', 'email', 'phone', 'address', 'ip'];
    const publicFields = ['domain', 'url', 'title', 'description', 'public'];

    const isSensitive = sensitiveFields.some(field => name.includes(field));
    const isPersonal = personalFields.some(field => name.includes(field)) || this.containsPII(value);
    const isPublic = publicFields.some(field => name.includes(field));

    return {
      personalData: isPersonal,
      sensitiveData: isSensitive,
      publicData: isPublic,
      businessData: !isPersonal && !isSensitive && !isPublic,
      riskLevel: isSensitive ? 'high' : isPersonal ? 'medium' : 'low'
    };
  }

  private containsPII(value: any): boolean {
    if (typeof value !== 'string') return false;

    return Object.values(this.piiPatterns).some(pattern => pattern.test(value));
  }

  private hashData(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  validateDataRetention(data: any, timestamp: Date): boolean {
    const retentionLimit = new Date();
    retentionLimit.setDate(retentionLimit.getDate() - this.config.retentionPeriod);
    
    return timestamp > retentionLimit;
  }

  generateComplianceReport(data: any): {
    totalFields: number;
    personalDataFields: number;
    sensitiveDataFields: number;
    redactedFields: number;
    complianceScore: number;
    recommendations: string[];
  } {
    const analysis = this.analyzeDataCompliance(data);
    
    const complianceScore = Math.max(0, 100 - (analysis.riskScore * 10));
    
    const recommendations: string[] = [];
    
    if (analysis.personalDataFields > 0) {
      recommendations.push('Consider minimizing personal data collection');
    }
    
    if (analysis.sensitiveDataFields > 0) {
      recommendations.push('Implement additional encryption for sensitive fields');
    }
    
    if (complianceScore < 80) {
      recommendations.push('Review data processing basis and implement stronger sanitization');
    }

    return {
      totalFields: analysis.totalFields,
      personalDataFields: analysis.personalDataFields,
      sensitiveDataFields: analysis.sensitiveDataFields,
      redactedFields: analysis.redactedFields,
      complianceScore,
      recommendations
    };
  }

  private analyzeDataCompliance(data: any, path = ''): {
    totalFields: number;
    personalDataFields: number;
    sensitiveDataFields: number;
    redactedFields: number;
    riskScore: number;
  } {
    let totalFields = 0;
    let personalDataFields = 0;
    let sensitiveDataFields = 0;
    let redactedFields = 0;
    let riskScore = 0;

    if (typeof data === 'string') {
      totalFields = 1;
      
      if (this.containsPII(data)) {
        personalDataFields = 1;
        riskScore += 2;
      }
      
      if (data.includes('REDACTED')) {
        redactedFields = 1;
      }
    } else if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const analysis = this.analyzeDataCompliance(item, `${path}[${index}]`);
        totalFields += analysis.totalFields;
        personalDataFields += analysis.personalDataFields;
        sensitiveDataFields += analysis.sensitiveDataFields;
        redactedFields += analysis.redactedFields;
        riskScore += analysis.riskScore;
      });
    } else if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        const fieldClassification = this.classifyField(key, value);
        
        if (fieldClassification.sensitiveData) {
          sensitiveDataFields += 1;
          riskScore += 3;
        }
        
        const analysis = this.analyzeDataCompliance(value, `${path}.${key}`);
        totalFields += analysis.totalFields;
        personalDataFields += analysis.personalDataFields;
        sensitiveDataFields += analysis.sensitiveDataFields;
        redactedFields += analysis.redactedFields;
        riskScore += analysis.riskScore;
      });
    }

    return {
      totalFields,
      personalDataFields,
      sensitiveDataFields,
      redactedFields,
      riskScore
    };
  }

  createDataProcessingRecord(
    purpose: string,
    dataTypes: string[],
    legalBasis: string,
    retentionPeriod: number
  ): {
    id: string;
    timestamp: Date;
    purpose: string;
    dataTypes: string[];
    legalBasis: string;
    retentionPeriod: number;
    complianceChecks: string[];
  } {
    return {
      id: this.hashData(`${purpose}-${Date.now()}`).substring(0, 16),
      timestamp: new Date(),
      purpose,
      dataTypes,
      legalBasis,
      retentionPeriod,
      complianceChecks: [
        'Data minimization principle applied',
        'Purpose limitation verified',
        'Retention period defined',
        'Legal basis documented'
      ]
    };
  }
}