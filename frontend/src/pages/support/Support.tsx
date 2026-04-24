import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Mail, Phone } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const Support: React.FC = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    email: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle support form submission
    console.log('Support form submitted:', formData);
  };

  const faqItems = [
    {
      question: "How do I upload a video?",
      answer: "Click the 'Upload Video' button in the top navigation or go to My Content and click 'Upload Video'."
    },
    {
      question: "How do I change my channel name?",
      answer: "Go to Settings > Channel Info and update your channel information."
    },
    {
      question: "How do I delete a video?",
      answer: "Go to My Content, find your video, and click the delete button in the video options."
    },
    {
      question: "How do I contact support?",
      answer: "You can contact us using the form below or email us directly at support@vidtube.com"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-8">
        <HelpCircle className="w-6 h-6 text-purple-500" />
        <h1 className="text-2xl font-bold">Support Center</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FAQ Section */}
        <div>
          <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-slate-800 rounded-lg p-4">
                <h3 className="font-medium mb-2">{item.question}</h3>
                <p className="text-gray-400 text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-xl font-bold mb-6">Contact Support</h2>
          
          {/* Contact Methods */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <MessageSquare className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Live Chat</p>
              <p className="text-xs text-gray-400">24/7 Support</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <Mail className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-gray-400">support@vidtube.com</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <Phone className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Phone</p>
              <p className="text-xs text-gray-400">+1 (555) 123-4567</p>
            </div>
          </div>

          {/* Support Form */}
          <div className="bg-slate-800 rounded-lg p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <Input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={5}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button type="submit">
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;