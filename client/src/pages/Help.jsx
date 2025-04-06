import React from 'react';

const Help = () => {
  const faqs = [
    {
      question: "What is process synchronization?",
      answer: "Process synchronization is the mechanism that ensures multiple processes can safely access shared resources and coordinate their execution to maintain system stability and data consistency."
    },
    {
      question: "How often does the system check for synchronization?",
      answer: "By default, the system checks for synchronization every 5 seconds. You can adjust this interval in the Settings page."
    },
    {
      question: "What do the different status colors mean?",
      answer: "Green indicates all processes are synchronized, yellow indicates some processes need attention, and red indicates synchronization issues that require immediate action."
    },
    {
      question: "How can I view detailed logs?",
      answer: "You can view detailed synchronization logs in the Logs page, where you can filter by status and search for specific events."
    },
    {
      question: "How do I set up email notifications?",
      answer: "Go to the Settings page and enable email notifications. You'll need to provide a valid email address where you want to receive alerts."
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Help & Documentation</h1>
        <p className="text-gray-600">Find answers to common questions and learn how to use the system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800">Dashboard Overview</h3>
              <p className="text-gray-600 mt-2">
                The dashboard provides a real-time overview of your system's process synchronization status.
                You can see the current status, metrics, and any active notifications.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Monitoring Process Synchronization</h3>
              <p className="text-gray-600 mt-2">
                The system continuously monitors process synchronization and provides real-time updates.
                You can view detailed metrics and receive notifications for any issues.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Configuring Settings</h3>
              <p className="text-gray-600 mt-2">
                Customize your experience by adjusting settings such as synchronization intervals,
                notification thresholds, and email alerts in the Settings page.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                <h3 className="font-medium text-gray-800">{faq.question}</h3>
                <p className="text-gray-600 mt-2">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              If you need additional assistance or have specific questions, please contact our support team:
            </p>
            <div className="space-y-2">
              <p className="text-gray-800">
                <span className="font-medium">Email:</span> support@processsync.com
              </p>
              <p className="text-gray-800">
                <span className="font-medium">Phone:</span> +1 (555) 123-4567
              </p>
              <p className="text-gray-800">
                <span className="font-medium">Hours:</span> Monday - Friday, 9:00 AM - 5:00 PM EST
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help; 