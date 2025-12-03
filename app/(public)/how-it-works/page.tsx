"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Share2, Plus, Users } from "lucide-react";

export default function HowItWorksPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Recipe examples for carousel
  const recipeExamples = [
    { id: 1, src: "/images/how-it-works/recipe-examples/example1.jpg", alt: "Handwritten recipe note" },
    { id: 2, src: "/images/how-it-works/recipe-examples/example2.jpg", alt: "Phone photo of homemade meal" },
    { id: 3, src: "/images/how-it-works/recipe-examples/example3.jpg", alt: "Voice memo transcription" },
  ];

  // Before/After examples
  const beforeAfterExamples = [
    {
      id: 1,
      before: "/images/how-it-works/before-after/before1.jpg",
      after: "/images/how-it-works/before-after/after1.jpg",
      alt: "Recipe transformation example 1"
    },
    {
      id: 2,
      before: "/images/how-it-works/before-after/before2.jpg",
      after: "/images/how-it-works/before-after/after2.jpg",
      alt: "Recipe transformation example 2"
    },
  ];

  const handleAddRecipe = () => {
    if (user) {
      router.push("/profile/recipes");
    } else {
      router.push("/onboarding");
    }
  };

  const handleInviteCollaborators = () => {
    if (user) {
      router.push("/profile/groups");
    } else {
      router.push("/onboarding");
    }
  };

  const handleStartCookbook = () => {
    if (user) {
      router.push("/profile");
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <>
      {/* Top Banner with Centered Logo */}
      <header
        role="banner"
        aria-label="Top banner"
        className="w-full bg-white border-b border-gray-200"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-8 h-20 flex items-center justify-center">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Company"
              width={180}
              height={36}
              priority
              className="hover:opacity-70 transition-opacity duration-300"
            />
          </Link>
        </div>
      </header>

      <main className="min-h-screen bg-white">
        {/* 1. Hero Section */}
        <section className="pt-20 pb-16 md:pt-32 md:pb-24">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-gray-900 mb-8">
                How it works!
              </h1>
              <div className="w-24 h-px bg-gray-300 mx-auto mb-8"></div>
              <h2 className="font-serif text-2xl md:text-3xl text-gray-700 font-light italic">
                Everything you need to create your book — beautifully, easily, and with the people you love.
              </h2>
            </motion.div>
          </div>
        </section>

        {/* 2. North Star Section */}
        <section className="pt-24 md:pt-32 pb-24 md:pb-32">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="relative aspect-[16/9] mb-8 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src="/images/how-it-works/lifestyle-photo.jpg"
                  alt="Family cooking together"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
              
              <div className="text-center space-y-6">
                <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light">
                  You&apos;re here to create a one-of-a-kind book that will live in your kitchen forever.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Expectations Section */}
        <section className="pt-24 md:pt-32 pb-24 md:pb-32 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-6"
              >
                <h2 className="font-serif text-4xl md:text-5xl font-medium text-gray-900 mb-6">
                  This isn&apos;t a professional book — it&apos;s a real one.
                </h2>
                <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light">
                  Real breakfasts. Real dinners. Real drinks. Real stories.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="relative"
              >
                <Carousel className="w-full">
                  <CarouselContent>
                    {recipeExamples.map((example) => (
                      <CarouselItem key={example.id}>
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={example.src}
                            alt={example.alt}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden lg:flex -left-12" />
                  <CarouselNext className="hidden lg:flex -right-12" />
                </Carousel>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 4. Three Paths Section */}
        <section className="pt-24 md:pt-32 pb-24 md:pb-32">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="space-y-24">
              {/* Introductory Overview - 3 Ways to Add Recipes */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center space-y-12 mb-16"
              >
                <h2 className="font-serif text-4xl md:text-5xl font-medium text-gray-900">
                  3 ways to get plates
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div className="flex flex-col items-center space-y-3 p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-gray-700" />
                    </div>
                    <span className="text-lg font-medium text-gray-900">Add them yourself</span>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-3 p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Share2 className="h-6 w-6 text-gray-700" />
                    </div>
                    <span className="text-lg font-medium text-gray-900">Collection Link</span>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-3 p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-700" />
                    </div>
                    <span className="text-lg font-medium text-gray-900">Shared Cookbooks</span>
                  </div>
                </div>
              </motion.div>

              {/* 4.1 Add Your Own Recipes */}
              <div className="text-center mb-3">
                <span className="text-normal font-medium tracking-widest uppercase text-gray-600">
                  1: ADD THEM YOURSELF
                </span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center space-y-8"
              >
                <div className="max-w-3xl mx-auto space-y-6">
                  <h2 className="font-serif text-4xl md:text-5xl font-medium text-gray-900">
                    Simply add your own plates.
                  </h2>
                </div>
                
                <div className="max-w-4xl mx-auto mt-12">
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 shadow-2xl">
                    <Image
                      src="/images/how_it_works_profilesection/add_a_recipe.png"
                      alt="Add Recipe Modal"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 1200px"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddRecipe}
                  size="lg"
                  className="mt-8 bg-gray-900 text-white hover:bg-gray-800 rounded-lg px-8 py-6 text-lg font-medium"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {user ? "Add a recipe" : "Get started"}
                </Button>
              </motion.div>

              {/* 4.2A Recipe Collection Link */}
              <div className="text-center mb-3">
                <span className="text-normal font-medium tracking-widest uppercase text-gray-600">
                  2: COLLECTION LINK
                </span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
              >
                <div className="space-y-6">
                  <h2 className="font-serif text-4xl md:text-5xl font-medium text-gray-900">
                    Send a link — no signup needeed.
                  </h2>
                  <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light">
                    They can upload a recipe by text, photo, or even a quick audio message.
                  </p>
                  <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-medium">
                    Share the link with one click via SMS, WhatsApp, or email.
                  </p>

                  <div className="flex flex-wrap gap-4 mt-8">
                    <Button variant="outline" size="lg" className="rounded-lg">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Share via SMS
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-lg">
                      <Share2 className="mr-2 h-5 w-5" />
                      Share via WhatsApp
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-lg">
                      <Mail className="mr-2 h-5 w-5" />
                      Share via Email
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src="/images/how-it-works/guest-submission-flow.gif"
                      alt="Guest submitting a recipe"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src="/images/how-it-works/guest-submission-page.jpg"
                      alt="Guest submission page screenshot"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </motion.div>

              {/* 4.2B Cookbook Collaboration */}
              <div className="text-center mb-3">
                <span className="text-normal font-medium tracking-widest uppercase text-gray-600">
                  3: SHARED COOKBOOKS
                </span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
              >
                <div className="space-y-6 order-2 lg:order-1">
                  <h2 className="font-serif text-4xl md:text-5xl font-medium text-gray-900">
                    Build your book in groups
                  </h2>
                  <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light">
                    Invite your people to join your book as collaborators.
                  </p>
                  <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light">
                    Everyone can add their own recipes — and collect recipes from their friends and family.
                  </p>

                  <Button
                    onClick={handleInviteCollaborators}
                    size="lg"
                    className="mt-8 bg-gray-900 text-white hover:bg-gray-800 rounded-lg px-8 py-6 text-lg font-medium"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    {user ? "Invite collaborators" : "Get started"}
                  </Button>
                </div>

                <div className="space-y-6 order-1 lg:order-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src="/images/how-it-works/collaboration-dashboard.jpg"
                      alt="Collaboration dashboard"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 5. The Magic Section */}
        <section className="pt-24 md:pt-32 pb-24 md:pb-32 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center space-y-12"
            >
              <div className="max-w-3xl mx-auto space-y-6">
                <h2 className="font-serif text-4xl md:text-5xl font-medium text-gray-900">
                  We turn every recipe into a beautiful, professionally designed page.
                </h2>
                <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light">
                  You send us the real stuff — the texts, photos, audios — and we turn it into something that looks amazing.
                </p>
              </div>

              <div className="mt-12">
                <Carousel className="w-full max-w-5xl mx-auto">
                  <CarouselContent>
                    {beforeAfterExamples.map((example) => (
                      <CarouselItem key={example.id}>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-600 text-center">Before</p>
                              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                  src={example.before}
                                  alt={`${example.alt} - before`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 1024px) 50vw, 400px"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-600 text-center">After</p>
                              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                  src={example.after}
                                  alt={`${example.alt} - after`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 1024px) 50vw, 400px"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden lg:flex -left-12" />
                  <CarouselNext className="hidden lg:flex -right-12" />
                </Carousel>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 6. Recipe Count Recommendation */}
        <section className="pt-24 md:pt-32 pb-24 md:pb-32">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center space-y-12"
            >
              <div className="max-w-3xl mx-auto space-y-6">
                <h2 className="font-serif text-4xl md:text-5xl font-medium text-gray-900">
                  For a beautiful hardcover cookbook, aim for 25+ recipes.
                </h2>
                <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light">
                  With around 25–35 recipes, your cookbook becomes an ~80-page book that feels full, substantial, and meaningful.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 7. Final Result Section */}
        <section className="pt-24 md:pt-32 pb-24 md:pb-32 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center space-y-12"
            >
              <div className="max-w-3xl mx-auto space-y-6">
                <h2 className="font-serif text-4xl md:text-5xl font-medium text-gray-900">
                  Here&apos;s what you&apos;ll receive:
                </h2>
                <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light">
                  A printed, hardcover, beautifully designed cookbook filled with the recipes and stories that make your life feel full.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 shadow-lg">
                  <Image
                    src="/images/how-it-works/book-cover.jpg"
                    alt="Cookbook cover"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 shadow-lg">
                  <Image
                    src="/images/how-it-works/book-spread.jpg"
                    alt="Cookbook open spread"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 shadow-lg">
                  <Image
                    src="/images/how-it-works/book-spine.jpg"
                    alt="Cookbook spine"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              </div>

              <div className="relative aspect-[16/9] max-w-4xl mx-auto mt-12 rounded-lg overflow-hidden bg-gray-100 shadow-lg">
                <Image
                  src="/images/how-it-works/book-lifestyle.jpg"
                  alt="Cookbook on kitchen table"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1200px"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* 8. Call to Action Section */}
        <section className="pt-24 md:pt-32 pb-16 md:pb-20 bg-gray-900">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center space-y-8"
            >
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-white mb-6">
                Ready to start gathering?
              </h2>
              
              <Button
                onClick={handleStartCookbook}
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 rounded-lg px-12 py-6 text-xl font-medium transition-colors duration-200"
              >
                {user ? "Start your cookbook" : "Get started"}
              </Button>

              <div className="pt-8">
                <Link 
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  ← Back to home
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}

