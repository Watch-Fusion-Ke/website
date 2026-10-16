"use client";

import { useState } from "react";
import { ChatIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
            {/* Header */}
            <section className="py-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Have a question or need assistance? We&apos;d love to hear from you.
                    Send us a message and we&apos;ll respond as soon as possible.
                </p>
            </section>

            {/* Contact Information & Form */}
            <section className="py-12 grid lg:grid-cols-3 gap-8">
                {/* Contact Info Cards */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6">
                        <MailIcon className="w-8 h-8 mb-3 text-gray-700" />
                        <h3 className="font-semibold text-lg mb-2">Email Us</h3>
                        <p className="text-gray-600">support@store.com</p>
                        <p className="text-gray-600">sales@store.com</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6">
                        <PhoneIcon className="w-8 h-8 mb-3 text-gray-700" />
                        <h3 className="font-semibold text-lg mb-2">Call Us</h3>
                        <p className="text-gray-600">+254 700 000 000</p>
                        <p className="text-sm text-gray-500 mt-1">Mon-Fri: 9am - 6pm EAT</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6">
                        <MapPinIcon className="w-8 h-8 mb-3 text-gray-700" />
                        <h3 className="font-semibold text-lg mb-2">Visit Us</h3>
                        <p className="text-gray-600">
                            Nairobi, Kenya<br />
                            Westlands Business Park
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6">
                        <ChatIcon className="w-8 h-8 mb-3 text-gray-700" />
                        <h3 className="font-semibold text-lg mb-2">Social Media</h3>
                        <div className="flex gap-3 mt-3">
                            <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-[#F35C7A] hover:text-white transition-colors">
                                F
                            </a>
                            <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-[#F35C7A] hover:text-white transition-colors">
                                T
                            </a>
                            <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-[#F35C7A] hover:text-white transition-colors">
                                I
                            </a>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>

                        {submitted && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                                ✓ Thank you! Your message has been sent successfully.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F35C7A] focus:border-transparent outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F35C7A] focus:border-transparent outline-none transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F35C7A] focus:border-transparent outline-none transition-all"
                                    placeholder="How can we help you?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message *
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F35C7A] focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="Tell us more about your inquiry..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#F35C7A] text-white py-4 rounded-lg font-semibold hover:bg-[#d14d66] transition-colors"
                            >
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-12">
                <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                <div className="max-w-3xl mx-auto space-y-4">
                    <details className="bg-gray-50 rounded-lg p-6 cursor-pointer">
                        <summary className="font-semibold text-lg">What are your shipping times?</summary>
                        <p className="mt-3 text-gray-600">
                            We typically process orders within 1-2 business days. Shipping times vary by location,
                            but most orders arrive within 3-7 business days.
                        </p>
                    </details>
                    <details className="bg-gray-50 rounded-lg p-6 cursor-pointer">
                        <summary className="font-semibold text-lg">What is your return policy?</summary>
                        <p className="mt-3 text-gray-600">
                            We offer a 30-day return policy on most items. Products must be unused and in their
                            original packaging. Contact us to initiate a return.
                        </p>
                    </details>
                    <details className="bg-gray-50 rounded-lg p-6 cursor-pointer">
                        <summary className="font-semibold text-lg">Do you ship internationally?</summary>
                        <p className="mt-3 text-gray-600">
                            Currently, we ship within Kenya. International shipping options may be available for
                            select products. Contact us for more information.
                        </p>
                    </details>
                </div>
            </section>
        </div>
    );
}