# Socratic Tutor skill

A free AI study partner for secondary-school students. It doesn't give you the answers: it asks good questions and gives small hints until **you** get there. Subjects: maths, biology, and podstawy przedsiębiorczości (personal finance), with a real-life case, *Your first summer job*.

Part of the student project **Not Just One Teacher** (EIT STEM Talent 2026). Live demo: https://tarasloto-byte.github.io/not-just-one-teacher/#/tutor

## What's inside

```
socratic-tutor/
  SKILL.md                      how the tutor behaves (the core)
  references/math.md            maths moves, misconceptions, example
  references/biology.md         biology moves, misconceptions, example
  references/entrepreneurship.md  finance topics + the "first summer job" case
  PROMPT.md                     short version for AI apps without skills
FOR-PARENTS.md                  one page for parents (EN + PL)
```

## How to install

**Before you start:** check the age rules of the AI app you use. Many AI apps, including Claude's consumer apps, require users to be 18 or older. If you're younger, use the tutor at school through a tool your school allows, or together with a parent.

### In the Claude app (claude.ai)
1. Download **[socratic-tutor.zip](https://tarasloto-byte.github.io/not-just-one-teacher/downloads/socratic-tutor.zip)**.
2. In Claude, open **Settings → Capabilities**, make sure Skills are turned on, and choose **Upload skill**. Select the zip file. (Menu names can change a little between versions.)
3. Start a new chat and say, for example: *"Pomóż mi zrozumieć funkcję kwadratową"* or *"Help me study for my biology test on cells."*

### In Claude Code
Copy the `socratic-tutor` folder to `~/.claude/skills/socratic-tutor/`, then start a new session.

### In any other AI app
Open [`socratic-tutor/PROMPT.md`](socratic-tutor/PROMPT.md), copy the text below the line into a new chat (or into the app's custom instructions), and say what you're studying.

## Principles

- **Invite, don't instruct:** the tutor is a curious partner, not an authority.
- **Co-create:** explanations are built from what you already know, in your words.
- **One hint at a time:** the "hint ladder" only goes up when you're really stuck.
- **Teach-back:** you finish by explaining the idea yourself.
- **In your teacher's corner:** it never replaces or criticises your teacher. It's one more person helping you.

## Contributing

Teachers and students are welcome to suggest new subject guides (chemistry, physics, informatics…) or improve the examples: open an issue or a pull request.
