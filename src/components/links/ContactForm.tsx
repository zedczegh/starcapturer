
import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";

const ContactForm = () => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // In a real implementation, you would send the email through a backend service
    // For demonstration purposes, we'll simulate the process and use mailto
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Open mailto link as fallback method
      const mailtoLink = `mailto:yanzeyu886@gmail.com?subject=${encodeURIComponent(
        `Resource question from ${name}`
      )}&body=${encodeURIComponent(
        `Message: ${message}\n\nReply to: ${email}`
      )}`;
      
      window.location.href = mailtoLink;
      
      // Show success toast
      toast.success(t("Message prepared in your email client!", "邮件已在您的邮件客户端中准备好！"));
      
      // Reset form
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      toast.error(t("Failed to send message. Please try again.", "发送消息失败，请重试。"));
      console.error("Error sending message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-cosmic-900/90 to-cosmic-950/80 border border-cosmic-700/30 rounded-xl p-6 backdrop-blur-sm shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Mail className="h-5 w-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-medium text-cosmic-100">
          {t("Contact Us", "联系我们")}
        </h3>
      </div>
      
      <p className="text-sm text-cosmic-300 mb-6">
        {t(
          "Have questions about astronomical resources? Send a message to our team at yanzeyu886@gmail.com",
          "有关于天文资源的问题？发送消息给我们的团队：yanzeyu886@gmail.com"
        )}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm text-cosmic-200">
            {t("Your Name", "您的姓名")}
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-cosmic-900/50 border-cosmic-700/30 text-cosmic-100 placeholder:text-cosmic-500"
            placeholder={t("Enter your name", "输入您的姓名")}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-cosmic-200">
            {t("Your Email", "您的邮箱")}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-cosmic-900/50 border-cosmic-700/30 text-cosmic-100 placeholder:text-cosmic-500"
            placeholder={t("Enter your email address", "输入您的邮箱地址")}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm text-cosmic-200">
            {t("Message", "留言")}
          </Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-cosmic-900/50 border-cosmic-700/30 text-cosmic-100 placeholder:text-cosmic-500 min-h-[120px]"
            placeholder={t("Enter your question or message", "输入您的问题或留言")}
            required
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {isSubmitting ? (
            <>
              <span className="animate-pulse mr-2">•••</span>
              {t("Sending", "发送中")}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {t("Send Message", "发送消息")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;
