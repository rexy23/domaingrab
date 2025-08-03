'use client';

import { Shield, Mail, FileText, Users, Globe, Clock, Lock, Eye } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-600">How we collect, use, and protect your data</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Version 1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-12">
            
            {/* Introduction */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Introduction</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  DomainGrab (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy and ensuring transparency 
                  about how we collect, use, and protect your information. This Privacy Policy explains our practices 
                  regarding personal data when you use our domain intelligence and analysis services.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  By using DomainGrab, you agree to the collection and use of information in accordance with this policy. 
                  We will not use or share your information except as described in this Privacy Policy.
                </p>
              </div>
            </section>

            {/* Data We Collect */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">What Data We Collect</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Information You Provide</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Domain Queries:</strong> Domain names and search terms you submit for analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Account Information:</strong> Email address, name, and billing information when you create an account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Communication:</strong> Messages you send to us through contact forms or support channels</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Information We Collect Automatically</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Usage Data:</strong> Pages visited, features used, time spent on our service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Technical Data:</strong> IP address, browser type, device information, operating system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Cookies:</strong> Essential cookies for functionality, analytics cookies (with consent)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Data */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Globe className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">How We Use Your Data</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Service Provision</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Provide domain intelligence and analysis</li>
                    <li>• Generate brandability and market fit scores</li>
                    <li>• Deliver search results and recommendations</li>
                    <li>• Maintain and improve our AI algorithms</li>
                  </ul>
                </div>
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Account Management</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Create and manage your account</li>
                    <li>• Process payments and billing</li>
                    <li>• Send important service notifications</li>
                    <li>• Provide customer support</li>
                  </ul>
                </div>
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Analytics & Improvement</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Analyze usage patterns and trends</li>
                    <li>• Improve our service performance</li>
                    <li>• Develop new features</li>
                    <li>• Ensure security and prevent fraud</li>
                  </ul>
                </div>
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Legal Compliance</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Comply with legal obligations</li>
                    <li>• Protect our rights and property</li>
                    <li>• Ensure platform safety and security</li>
                    <li>• Respond to legal requests</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Legal Basis */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Legal Basis for Processing</h2>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                  <div className="font-semibold text-blue-900 mb-2">Contract Performance</div>
                  <p className="text-blue-800 text-sm">Processing necessary to provide our domain analysis services</p>
                </div>
                <div className="p-4 border-l-4 border-green-500 bg-green-50">
                  <div className="font-semibold text-green-900 mb-2">Legitimate Interest</div>
                  <p className="text-green-800 text-sm">Improving our services, security, and business operations</p>
                </div>
                <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                  <div className="font-semibold text-purple-900 mb-2">Consent</div>
                  <p className="text-purple-800 text-sm">Marketing communications and analytics cookies (where applicable)</p>
                </div>
                <div className="p-4 border-l-4 border-orange-500 bg-orange-50">
                  <div className="font-semibold text-orange-900 mb-2">Legal Obligation</div>
                  <p className="text-orange-800 text-sm">Compliance with data protection laws and regulations</p>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Lock className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Data Sharing & Third Parties</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-3">We Do NOT Sell Your Data</h3>
                  <p className="text-red-800">
                    We never sell, rent, or trade your personal information to third parties for their marketing purposes.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">We may share data with:</h3>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Service Providers</h4>
                      <p className="text-gray-700 text-sm">
                        Third-party companies that help us operate our service (hosting, payment processing, 
                        email delivery) under strict data processing agreements.
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Legal Requirements</h4>
                      <p className="text-gray-700 text-sm">
                        When required by law, court order, or to protect our rights and the safety of our users.
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Business Transfers</h4>
                      <p className="text-gray-700 text-sm">
                        In connection with a merger, acquisition, or sale of assets, with proper user notification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Storage & Security */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Shield className="h-5 w-5 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Data Storage & Security</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Data Retention</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Account data: Until account deletion</li>
                    <li>• Domain queries: 12 months for service improvement</li>
                    <li>• Usage analytics: 24 months (anonymized)</li>
                    <li>• Support communications: 3 years</li>
                    <li>• Legal compliance: As required by law</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Security Measures</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• TLS/SSL encryption for data transmission</li>
                    <li>• Encrypted data storage</li>
                    <li>• Access controls and authentication</li>
                    <li>• Regular security audits and updates</li>
                    <li>• GDPR-compliant data processing</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* International Data Transfers */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Globe className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">International Data Transfers</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h3 className="font-semibold text-indigo-900 mb-3">Cross-Border Data Processing</h3>
                  <p className="text-indigo-800 mb-4">
                    Where we transfer your personal data outside the European Economic Area (EEA) or UK, 
                    we ensure appropriate safeguards are in place to protect your data in compliance with GDPR.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Third Party Services</h3>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div>
                        <strong>Google Analytics (USA):</strong>
                        <p>Protected by Standard Contractual Clauses (SCCs) and Google&rsquo;s EU-US Data Privacy Framework certification</p>
                      </div>
                      <div>
                        <strong>Stripe (USA):</strong>
                        <p>Adequacy decision and certified under Privacy Shield successor frameworks</p>
                      </div>
                      <div>
                        <strong>Anthropic Claude AI (USA):</strong>
                        <p>Protected by Standard Contractual Clauses and enterprise data processing agreements</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Safeguards in Place</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>✅ Standard Contractual Clauses (SCCs)</li>
                      <li>✅ Adequacy decisions where available</li>
                      <li>✅ Privacy Shield successor certifications</li>
                      <li>✅ Binding Corporate Rules (BCRs)</li>
                      <li>✅ Technical and organizational measures</li>
                      <li>✅ Regular compliance audits</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-2">Your Rights Regarding International Transfers</h4>
                  <p className="text-orange-800 text-sm">
                    You have the right to obtain information about the safeguards we have in place for international transfers. 
                    You may also object to transfers in certain circumstances. Contact us at 
                    <a href="mailto:privacy@domaingrab.com" className="font-medium hover:underline"> privacy@domaingrab.com</a> for more details.
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-50 rounded-lg">
                  <Users className="h-5 w-5 text-teal-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Your Rights</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Access</h3>
                  <p className="text-gray-700 text-sm">Request a copy of your personal data</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Rectification</h3>
                  <p className="text-gray-700 text-sm">Correct inaccurate or incomplete data</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Erasure</h3>
                  <p className="text-gray-700 text-sm">Request deletion of your personal data</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Restriction</h3>
                  <p className="text-gray-700 text-sm">Limit how we process your data</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Portability</h3>
                  <p className="text-gray-700 text-sm">Export your data in a machine-readable format</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Object</h3>
                  <p className="text-gray-700 text-sm">Object to processing based on legitimate interest</p>
                </div>
                <div className="p-4 border-2 border-orange-200 bg-orange-50 rounded-lg">
                  <h3 className="font-medium text-orange-900 mb-2">Withdraw Consent</h3>
                  <p className="text-orange-800 text-sm">
                    If we process your data based on your consent, you have the right to withdraw it at any time 
                    without affecting the lawfulness of processing based on consent before its withdrawal.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-6 bg-orange-50 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-900 mb-3">🔄 Easy Consent Management</h3>
                <p className="text-orange-800 mb-4">
                  You can easily withdraw or modify your consent for cookies and marketing communications:
                </p>
                <ul className="text-orange-800 text-sm space-y-2">
                  <li>• <strong>Cookie Consent:</strong> Visit our <a href="/cookie-preferences" className="font-medium hover:underline">Cookie Settings</a> page anytime</li>
                  <li>• <strong>Marketing Emails:</strong> Use the unsubscribe link in any email or contact us</li>
                  <li>• <strong>Analytics:</strong> Disable tracking through your Cookie Settings</li>
                  <li>• <strong>Complete Withdrawal:</strong> Contact us to withdraw all consent-based processing</li>
                </ul>
              </div>

              <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Exercise Your Rights</h3>
                <p className="text-blue-800 mb-4">
                  To exercise any of these rights, please contact us using the information below. 
                  We will respond within 30 days of receiving your request.
                </p>
                <div className="flex items-center gap-2 text-blue-800">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:privacy@domaingrab.com" className="font-medium hover:underline">
                    privacy@domaingrab.com
                  </a>
                </div>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-50 rounded-lg">
                  <Shield className="h-5 w-5 text-pink-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Children&rsquo;s Privacy Protection</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-pink-50 rounded-lg border border-pink-200">
                  <h3 className="font-semibold text-pink-900 mb-3">Age Restrictions</h3>
                  <p className="text-pink-800 mb-4">
                    We do not knowingly collect personal data from individuals under the age of 16 in the EU 
                    or under 13 in other jurisdictions. Our service is intended for business users and adults 
                    seeking domain intelligence for professional purposes.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">If You Are a Parent or Guardian</h3>
                    <div className="text-gray-700 text-sm space-y-2">
                      <p>
                        If you believe your child has provided us with personal data, please contact us immediately at:
                      </p>
                      <div className="p-3 bg-gray-50 rounded">
                        <p><strong>Email:</strong> <a href="mailto:privacy@domaingrab.com" className="text-blue-600 hover:underline">privacy@domaingrab.com</a></p>
                        <p><strong>Subject:</strong> &ldquo;Child Data Removal Request&rdquo;</p>
                      </div>
                      <p>
                        We will investigate and, if necessary, delete the information as quickly as possible.
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Our Commitment</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>✅ No intentional collection from minors</li>
                      <li>✅ Business-focused service design</li>
                      <li>✅ Immediate response to parent requests</li>
                      <li>✅ Deletion within 30 days of verification</li>
                      <li>✅ No marketing to minors</li>
                      <li>✅ Age-appropriate content warnings</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-2">⚠️ Important Note</h4>
                  <p className="text-orange-800 text-sm">
                    If you are under 16 (EU) or 13 (elsewhere) and have used our service, please ask a parent 
                    or guardian to contact us. We take children&rsquo;s privacy very seriously and will work with 
                    families to ensure compliance with applicable laws.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Contact Us</h2>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Data Protection Officer</h3>
                    <div className="space-y-1 text-gray-700">
                      <p>Email: <a href="mailto:dpo@domaingrab.com" className="text-blue-600 hover:underline">dpo@domaingrab.com</a></p>
                      <p>Response time: Within 72 hours</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">General Privacy Inquiries</h3>
                    <div className="space-y-1 text-gray-700">
                      <p>Email: <a href="mailto:privacy@domaingrab.com" className="text-blue-600 hover:underline">privacy@domaingrab.com</a></p>
                      <p>Subject line: &ldquo;Privacy Policy Inquiry&rdquo;</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Supervisory Authority</h3>
                    <div className="text-gray-700 text-sm space-y-3">
                      <p>
                        If you have concerns about our data practices, you have the right to lodge a complaint 
                        with your local data protection authority.
                      </p>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-900 mb-2">Key Supervisory Authorities:</p>
                        <ul className="text-blue-800 text-sm space-y-1">
                          <li>
                            <strong>EU:</strong> Find your local authority at{' '}
                            <a 
                              href="https://edpb.europa.eu/about-edpb/board/members_en" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="underline hover:no-underline"
                            >
                              https://edpb.europa.eu/about-edpb/board/members_en
                            </a>
                          </li>
                          <li>
                            <strong>UK:</strong> Information Commissioner&rsquo;s Office (ICO) -{' '}
                            <a 
                              href="https://ico.org.uk/" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="underline hover:no-underline"
                            >
                              https://ico.org.uk/
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Updates */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Policy Updates</h2>
              </div>
              
              <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-orange-800 mb-4">
                  We may update this Privacy Policy from time to time to reflect changes in our practices 
                  or for legal and regulatory reasons.
                </p>
                <ul className="space-y-2 text-orange-800 text-sm">
                  <li>• We will notify you of significant changes via email or prominent notice on our website</li>
                  <li>• The &ldquo;Last Updated&rdquo; date at the top will reflect the most recent changes</li>
                  <li>• Continued use of our service after changes constitutes acceptance</li>
                  <li>• You may withdraw your consent and close your account if you disagree with changes</li>
                </ul>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}