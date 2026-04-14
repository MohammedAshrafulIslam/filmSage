/**
 * seed-movies.js — Populate Supabase with 50 movie descriptions + embeddings.
 *
 * Run:  node eval/seed-movies.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(__dirname, '..', 'server', 'index.js'));
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

const movies = [
  `The Shawshank Redemption (1994). Directed by Frank Darabont. Starring Tim Robbins and Morgan Freeman. A banker named Andy Dufresne is sentenced to life in Shawshank State Penitentiary for the murder of his wife and her lover, despite his claims of innocence. Over two decades, he forms a friendship with fellow inmate Red and finds ways to maintain hope. Genre: Drama. Rating: 9.3/10. Runtime: 142 minutes. The film explores themes of hope, friendship, and resilience within the prison system.`,

  `The Godfather (1972). Directed by Francis Ford Coppola. Starring Marlon Brando and Al Pacino. The aging patriarch of an organized crime dynasty, Vito Corleone, transfers control of his empire to his reluctant youngest son Michael. Genre: Crime, Drama. Rating: 9.2/10. Runtime: 175 minutes. Based on Mario Puzo's novel, it depicts the Corleone family's rise and moral compromises in post-war America.`,

  `The Dark Knight (2008). Directed by Christopher Nolan. Starring Christian Bale and Heath Ledger. Batman faces the Joker, a criminal mastermind who plunges Gotham City into anarchy. Heath Ledger's portrayal of the Joker earned a posthumous Academy Award. Genre: Action, Crime, Drama. Rating: 9.0/10. Runtime: 152 minutes. The film explores the thin line between heroism and vigilantism.`,

  `Pulp Fiction (1994). Directed by Quentin Tarantino. Starring John Travolta, Uma Thurman, and Samuel L. Jackson. Multiple interconnected stories of criminals in Los Angeles unfold in a non-linear narrative. Genre: Crime, Drama. Rating: 8.9/10. Runtime: 154 minutes. Won the Palme d'Or at Cannes and an Academy Award for Best Original Screenplay.`,

  `Schindler's List (1993). Directed by Steven Spielberg. Starring Liam Neeson and Ralph Fiennes. The true story of Oskar Schindler, a German industrialist who saved over 1,100 Jews during the Holocaust by employing them in his factories. Genre: Biography, Drama, History. Rating: 9.0/10. Runtime: 195 minutes. Shot primarily in black and white. Won 7 Academy Awards including Best Picture and Best Director.`,

  `Inception (2010). Directed by Christopher Nolan. Starring Leonardo DiCaprio. Dom Cobb is a thief who steals corporate secrets through dream-sharing technology. He is offered a chance to have his criminal record erased if he can successfully perform "inception" — planting an idea in someone's subconscious. Genre: Action, Sci-Fi, Thriller. Rating: 8.8/10. Runtime: 148 minutes.`,

  `Fight Club (1999). Directed by David Fincher. Starring Brad Pitt and Edward Norton. An insomniac office worker forms an underground fight club with a soap salesman named Tyler Durden. The club evolves into something much more dangerous. Genre: Drama. Rating: 8.8/10. Runtime: 139 minutes. Based on Chuck Palahniuk's 1996 novel. Known for its twist ending and commentary on consumer culture.`,

  `Forrest Gump (1994). Directed by Robert Zemeckis. Starring Tom Hanks. Forrest Gump, a man with a low IQ but good intentions, witnesses and unwittingly influences several defining historical events in 20th century America. Genre: Drama, Romance. Rating: 8.8/10. Runtime: 142 minutes. Won 6 Academy Awards including Best Picture, Best Director, and Best Actor for Tom Hanks.`,

  `The Matrix (1999). Directed by the Wachowskis. Starring Keanu Reeves, Laurence Fishburne, and Carrie-Anne Moss. A computer programmer discovers that reality as he knows it is a simulation created by machines, and joins a rebellion to free humanity. Genre: Action, Sci-Fi. Rating: 8.7/10. Runtime: 136 minutes. Pioneered the "bullet time" visual effect and influenced action cinema.`,

  `Goodfellas (1990). Directed by Martin Scorsese. Starring Ray Liotta, Robert De Niro, and Joe Pesci. The true story of Henry Hill and his life in the mob, from 1955 to 1980. Genre: Biography, Crime, Drama. Rating: 8.7/10. Runtime: 146 minutes. Joe Pesci won an Academy Award for Best Supporting Actor. Based on the book "Wiseguy" by Nicholas Pileggi.`,

  `Interstellar (2014). Directed by Christopher Nolan. Starring Matthew McConaughey and Anne Hathaway. A group of astronauts travel through a wormhole near Saturn in search of a new habitable planet for humanity as Earth faces an agricultural crisis. Genre: Adventure, Drama, Sci-Fi. Rating: 8.7/10. Runtime: 169 minutes. Physicist Kip Thorne served as scientific consultant. Won the Academy Award for Best Visual Effects.`,

  `The Lord of the Rings: The Return of the King (2003). Directed by Peter Jackson. Starring Elijah Wood, Viggo Mortensen, and Ian McKellen. Gandalf and Aragorn lead the World of Men against Sauron's army while Frodo and Sam approach Mount Doom to destroy the One Ring. Genre: Action, Adventure, Drama. Rating: 9.0/10. Runtime: 201 minutes. Won all 11 Academy Awards it was nominated for, tying the record.`,

  `The Lord of the Rings: The Fellowship of the Ring (2001). Directed by Peter Jackson. Starring Elijah Wood and Ian McKellen. A young hobbit named Frodo inherits the One Ring and must embark on a quest to destroy it in the fires of Mount Doom before the Dark Lord Sauron can reclaim it. Genre: Action, Adventure, Drama. Rating: 8.8/10. Runtime: 178 minutes. Filmed entirely in New Zealand.`,

  `Star Wars: Episode V - The Empire Strikes Back (1980). Directed by Irvin Kershner. Starring Mark Hamill, Harrison Ford, and Carrie Fisher. The Rebel Alliance is pursued by the Empire. Luke Skywalker trains with Jedi Master Yoda while his friends are pursued by Darth Vader. Features the iconic "I am your father" reveal. Genre: Action, Adventure, Fantasy. Rating: 8.7/10. Runtime: 124 minutes.`,

  `The Silence of the Lambs (1991). Directed by Jonathan Demme. Starring Jodie Foster and Anthony Hopkins. FBI trainee Clarice Starling seeks the help of imprisoned cannibalistic serial killer Dr. Hannibal Lecter to catch another serial killer known as Buffalo Bill. Genre: Crime, Drama, Thriller. Rating: 8.6/10. Runtime: 118 minutes. Won the "Big Five" Academy Awards: Picture, Director, Actor, Actress, and Screenplay.`,

  `Spirited Away (2001). Directed by Hayao Miyazaki. Studio Ghibli. A 10-year-old girl named Chihiro becomes trapped in a mysterious spirit world after her parents are transformed into pigs. She must work in a bathhouse for spirits to find a way to free herself and her parents. Genre: Animation, Adventure, Family. Rating: 8.6/10. Runtime: 125 minutes. Won the Academy Award for Best Animated Feature. Japanese title: Sen to Chihiro no Kamikakushi.`,

  `Parasite (2019). Directed by Bong Joon-ho. Starring Song Kang-ho. The Kim family, who are poor, scheme to become employed by the wealthy Park family by posing as unrelated, highly qualified individuals. Genre: Comedy, Drama, Thriller. Rating: 8.5/10. Runtime: 132 minutes. First non-English language film to win the Academy Award for Best Picture. Also won Best Director, Best Original Screenplay, and Best International Feature Film. South Korean film.`,

  `Whiplash (2014). Directed by Damien Chazelle. Starring Miles Teller and J.K. Simmons. A young jazz drummer at a prestigious music conservatory is pushed to his limits by a ruthless instructor named Terence Fletcher. Genre: Drama, Music. Rating: 8.5/10. Runtime: 106 minutes. J.K. Simmons won the Academy Award for Best Supporting Actor. Explores the cost of artistic perfection.`,

  `The Prestige (2006). Directed by Christopher Nolan. Starring Hugh Jackman and Christian Bale. Two rival magicians in Victorian London engage in an escalating battle of tricks and sabotage, each trying to create the ultimate illusion. Genre: Drama, Mystery, Sci-Fi. Rating: 8.5/10. Runtime: 130 minutes. Features David Bowie as Nikola Tesla. Based on Christopher Priest's 1995 novel.`,

  `Django Unchained (2012). Directed by Quentin Tarantino. Starring Jamie Foxx, Christoph Waltz, and Leonardo DiCaprio. A freed slave teams up with a German bounty hunter to rescue his wife from a brutal plantation owner in the pre-Civil War South. Genre: Drama, Western. Rating: 8.5/10. Runtime: 165 minutes. Christoph Waltz won the Academy Award for Best Supporting Actor. Tarantino won Best Original Screenplay.`,

  `Gladiator (2000). Directed by Ridley Scott. Starring Russell Crowe and Joaquin Phoenix. A former Roman general is forced into slavery and becomes a gladiator, seeking vengeance against the corrupt emperor Commodus who murdered his family. Genre: Action, Adventure, Drama. Rating: 8.5/10. Runtime: 155 minutes. Won 5 Academy Awards including Best Picture and Best Actor for Russell Crowe.`,

  `The Lion King (1994). Directed by Roger Allers and Rob Minkoff. Disney animated film. A young lion prince named Simba flees his kingdom after the murder of his father Mufasa by his uncle Scar, and must return as an adult to reclaim his throne. Genre: Animation, Adventure, Drama. Rating: 8.5/10. Runtime: 88 minutes. Features music by Elton John and Tim Rice. "Circle of Life" and "Hakuna Matata" are iconic songs.`,

  `Saving Private Ryan (1998). Directed by Steven Spielberg. Starring Tom Hanks and Matt Damon. After the D-Day invasion of Normandy, Captain John Miller leads a squad on a dangerous mission to find and bring home Private James Ryan, whose three brothers have been killed in action. Genre: Drama, War. Rating: 8.6/10. Runtime: 169 minutes. Famous for its realistic 27-minute Omaha Beach opening sequence. Won 5 Academy Awards.`,

  `The Departed (2006). Directed by Martin Scorsese. Starring Leonardo DiCaprio, Matt Damon, and Jack Nicholson. An undercover cop and a mole in the police force try to identify each other while infiltrating an Irish gang in Boston. Genre: Crime, Drama, Thriller. Rating: 8.5/10. Runtime: 151 minutes. Won 4 Academy Awards including Best Picture and Best Director — Scorsese's first Oscar win. Remake of the Hong Kong film Infernal Affairs.`,

  `Back to the Future (1985). Directed by Robert Zemeckis. Starring Michael J. Fox and Christopher Lloyd. Teenager Marty McFly is accidentally sent back in time to 1955 using a time machine built by his eccentric scientist friend Doc Brown from a DeLorean. He must ensure his parents meet and fall in love to secure his own existence. Genre: Adventure, Comedy, Sci-Fi. Rating: 8.5/10. Runtime: 116 minutes.`,

  `The Green Mile (1999). Directed by Frank Darabont. Starring Tom Hanks and Michael Clarke Duncan. Death row prison guard Paul Edgecomb discovers that one of his inmates, a giant man named John Coffey, has supernatural healing abilities. Genre: Crime, Drama, Fantasy. Rating: 8.6/10. Runtime: 189 minutes. Based on Stephen King's serial novel. Michael Clarke Duncan was nominated for Best Supporting Actor.`,

  `Alien (1979). Directed by Ridley Scott. Starring Sigourney Weaver. The crew of the spaceship Nostromo encounters a deadly extraterrestrial creature that picks them off one by one. Sigourney Weaver stars as Ellen Ripley. Genre: Horror, Sci-Fi. Rating: 8.5/10. Runtime: 117 minutes. Won the Academy Award for Best Visual Effects. Launched a major franchise. The tagline was "In space, no one can hear you scream."`,

  `WALL-E (2008). Directed by Andrew Stanton. Pixar Animation Studios. In the distant future, a small waste-collecting robot named WALL-E is left alone on a deserted, trash-covered Earth. He falls in love with a sleek probe robot named EVE and follows her into space. Genre: Animation, Adventure, Family. Rating: 8.4/10. Runtime: 98 minutes. Won the Academy Award for Best Animated Feature. First 40 minutes have almost no dialogue.`,

  `The Truman Show (1998). Directed by Peter Weir. Starring Jim Carrey. Truman Burbank discovers his entire life is actually an elaborate television show, and everyone around him — including his wife and best friend — are actors. Genre: Comedy, Drama. Rating: 8.2/10. Runtime: 103 minutes. Jim Carrey's first major dramatic role. Explores themes of reality, free will, and media manipulation.`,

  `Jurassic Park (1993). Directed by Steven Spielberg. Starring Sam Neill, Laura Dern, and Jeff Goldblum. A theme park with cloned dinosaurs created from prehistoric DNA turns deadly when the security systems fail and the dinosaurs escape. Genre: Action, Adventure, Sci-Fi. Rating: 8.2/10. Runtime: 127 minutes. Based on Michael Crichton's novel. Revolutionary CGI and animatronic dinosaurs. Grossed over $1 billion worldwide.`,

  `The Social Network (2010). Directed by David Fincher. Starring Jesse Eisenberg. The story of the founding of Facebook by Mark Zuckerberg at Harvard University and the resulting lawsuits from former associates Eduardo Saverin and the Winklevoss twins. Genre: Biography, Drama. Rating: 7.8/10. Runtime: 120 minutes. Screenplay by Aaron Sorkin. Won 3 Academy Awards. Score by Trent Reznor and Atticus Ross.`,

  `Mad Max: Fury Road (2015). Directed by George Miller. Starring Tom Hardy and Charlize Theron. In a post-apocalyptic wasteland, Max teams up with Imperator Furiosa to flee from a tyrannical warlord and his army in a high-speed chase across the desert. Genre: Action, Adventure, Sci-Fi. Rating: 8.1/10. Runtime: 120 minutes. Won 6 Academy Awards. Noted for practical stunts over CGI. Charlize Theron's Furiosa became an iconic character.`,

  `Blade Runner 2049 (2017). Directed by Denis Villeneuve. Starring Ryan Gosling and Harrison Ford. LAPD Officer K, a new blade runner, discovers a long-buried secret that could plunge what's left of society into chaos. His discovery leads him on a quest to find Rick Deckard, a former blade runner who has been missing for 30 years. Genre: Action, Drama, Sci-Fi. Rating: 8.0/10. Runtime: 164 minutes. Won 2 Academy Awards for cinematography and visual effects.`,

  `Get Out (2017). Directed by Jordan Peele. Starring Daniel Kaluuya. A young African-American man visits his white girlfriend's family estate, where he becomes ensnared in a disturbing secret. Genre: Horror, Mystery, Thriller. Rating: 7.7/10. Runtime: 104 minutes. Jordan Peele won the Academy Award for Best Original Screenplay. Made on a $4.5 million budget and grossed $255 million worldwide. Peele's directorial debut.`,

  `Coco (2017). Directed by Lee Unkrich. Pixar Animation Studios. A 12-year-old Mexican boy named Miguel accidentally enters the Land of the Dead during Dia de los Muertos. He seeks the help of his deceased musician great-great-grandfather to return to the living. Genre: Animation, Adventure, Family. Rating: 8.4/10. Runtime: 105 minutes. Won 2 Academy Awards: Best Animated Feature and Best Original Song ("Remember Me"). Celebrates Mexican culture and traditions.`,

  `No Country for Old Men (2007). Directed by Joel and Ethan Coen. Starring Javier Bardem, Josh Brolin, and Tommy Lee Jones. A hunter stumbles upon a drug deal gone wrong and takes $2 million in cash, leading to a violent pursuit by a psychopathic killer named Anton Chigurh who uses a captive bolt pistol. Genre: Crime, Drama, Thriller. Rating: 8.2/10. Runtime: 122 minutes. Won 4 Academy Awards including Best Picture and Best Director. Based on Cormac McCarthy's novel.`,

  `Eternal Sunshine of the Spotless Mind (2004). Directed by Michel Gondry. Starring Jim Carrey and Kate Winslet. After a painful breakup, Joel discovers that his ex-girlfriend Clementine has undergone a procedure to erase all memories of him. Heartbroken, he decides to do the same, but during the process he realizes he wants to keep the memories. Genre: Drama, Romance, Sci-Fi. Rating: 8.3/10. Runtime: 108 minutes. Won the Academy Award for Best Original Screenplay by Charlie Kaufman.`,

  `12 Angry Men (1957). Directed by Sidney Lumet. Starring Henry Fonda. Twelve jurors deliberate the fate of a young man accused of murdering his father. Initially 11 vote guilty, but one dissenting juror forces the others to reconsider the evidence. Genre: Crime, Drama. Rating: 9.0/10. Runtime: 96 minutes. Nearly the entire film takes place in a single jury room. Sidney Lumet's directorial debut. Explores themes of justice, prejudice, and reasonable doubt.`,

  `The Grand Budapest Hotel (2014). Directed by Wes Anderson. Starring Ralph Fiennes. The adventures of Gustave H, a legendary concierge at a famous European hotel, and Zero Moustafa, the lobby boy who becomes his most trusted friend. Genre: Adventure, Comedy, Crime. Rating: 8.1/10. Runtime: 99 minutes. Won 4 Academy Awards. Known for its symmetrical cinematography, pastel color palette, and aspect ratio changes between time periods.`,

  `Arrival (2016). Directed by Denis Villeneuve. Starring Amy Adams and Jeremy Renner. When twelve mysterious alien spacecraft appear around the world, linguistics professor Louise Banks is recruited by the military to communicate with the extraterrestrials. The film explores how language shapes our perception of time. Genre: Drama, Sci-Fi. Rating: 7.9/10. Runtime: 116 minutes. Based on Ted Chiang's short story "Story of Your Life." Won the Academy Award for Best Sound Editing.`,

  `Joker (2019). Directed by Todd Phillips. Starring Joaquin Phoenix. Arthur Fleck, a failed stand-up comedian in Gotham City, descends into madness and transforms into the criminal mastermind known as the Joker. Genre: Crime, Drama, Thriller. Rating: 8.4/10. Runtime: 122 minutes. Joaquin Phoenix won the Academy Award for Best Actor. Made on a $55 million budget and grossed over $1 billion worldwide. First R-rated film to cross $1 billion.`,

  `Up (2009). Directed by Pete Docter. Pixar Animation Studios. A 78-year-old widower named Carl Fredricksen ties thousands of balloons to his house and flies to South America to fulfill his late wife's dream of visiting Paradise Falls. He is unexpectedly joined by an 8-year-old Wilderness Explorer named Russell. Genre: Animation, Adventure, Comedy. Rating: 8.3/10. Runtime: 96 minutes. Famous for its emotional opening montage. Won 2 Academy Awards.`,

  `The Revenant (2015). Directed by Alejandro Gonzalez Inarritu. Starring Leonardo DiCaprio. Frontiersman Hugh Glass is left for dead by his hunting team after a bear attack in 1823. He survives and embarks on a journey through harsh wilderness to find the man who betrayed him. Genre: Action, Adventure, Drama. Rating: 8.0/10. Runtime: 156 minutes. Leonardo DiCaprio won his first Academy Award for Best Actor. Shot using only natural light. Filmed in extreme cold conditions in Canada and Argentina.`,

  `La La Land (2016). Directed by Damien Chazelle. Starring Ryan Gosling and Emma Stone. A jazz pianist and an aspiring actress fall in love in Los Angeles while pursuing their dreams. Genre: Comedy, Drama, Musical. Rating: 8.0/10. Runtime: 128 minutes. Won 6 Academy Awards including Best Director (Chazelle became youngest winner at 32) and Best Actress for Emma Stone. Famously announced as Best Picture winner before the error was corrected — the actual winner was Moonlight.`,

  `Toy Story (1995). Directed by John Lasseter. Pixar Animation Studios. Woody, a cowboy doll, feels threatened when his owner Andy receives a new Buzz Lightyear action figure for his birthday. The two rivals must work together when they become lost. Genre: Animation, Adventure, Comedy. Rating: 8.3/10. Runtime: 81 minutes. The first entirely computer-animated feature film. Launched the Pixar franchise and revolutionized animation. Features voices of Tom Hanks and Tim Allen.`,

  `Her (2013). Directed by Spike Jonze. Starring Joaquin Phoenix and Scarlett Johansson (voice). In a near-future Los Angeles, a lonely man named Theodore develops a romantic relationship with an intelligent operating system named Samantha. Genre: Drama, Romance, Sci-Fi. Rating: 8.0/10. Runtime: 126 minutes. Won the Academy Award for Best Original Screenplay. Explores themes of loneliness, human connection, and artificial intelligence.`,

  `Everything Everywhere All at Once (2022). Directed by Daniel Kwan and Daniel Scheinert. Starring Michelle Yeoh, Ke Huy Quan, and Jamie Lee Curtis. A Chinese-American woman being audited by the IRS discovers she can access the skills and memories of her parallel universe selves to save the multiverse. Genre: Action, Adventure, Comedy. Rating: 7.8/10. Runtime: 139 minutes. Won 7 Academy Awards including Best Picture, Best Director, Best Actress (Yeoh), and Best Supporting Actor (Quan). Made on a $25 million budget.`,

  `Dunkirk (2017). Directed by Christopher Nolan. Starring Fionn Whitehead, Tom Hardy, and Mark Rylance. The evacuation of Allied soldiers from the beaches of Dunkirk, France during World War II, told from three perspectives: land (one week), sea (one day), and air (one hour). Genre: Action, Drama, History. Rating: 7.8/10. Runtime: 106 minutes. Won 3 Academy Awards. Nolan used minimal CGI and real WWII-era planes. Features a non-linear timeline.`,

  `The Usual Suspects (1995). Directed by Bryan Singer. Starring Kevin Spacey and Gabriel Byrne. A sole survivor tells investigators an elaborate story about events leading up to a deadly gunfight on a boat, all centering around a mysterious crime lord called Keyser Soze. Genre: Crime, Drama, Mystery. Rating: 8.5/10. Runtime: 106 minutes. Kevin Spacey won the Academy Award for Best Supporting Actor. Famous for its twist ending.`,

  `Moonlight (2016). Directed by Barry Jenkins. Starring Mahershala Ali, Naomie Harris, and Trevante Rhodes. The life of a young African-American man told across three stages: childhood, adolescence, and adulthood, growing up in a rough neighborhood in Miami while grappling with his identity and sexuality. Genre: Drama. Rating: 7.4/10. Runtime: 111 minutes. Won 3 Academy Awards including Best Picture. Mahershala Ali won Best Supporting Actor. First film with an all-Black cast to win Best Picture.`,
];

async function main() {
  console.log(`Seeding ${movies.length} movies into Supabase...\n`);

  // Process in batches of 10 to stay under rate limits
  const batchSize = 10;
  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize);
    console.log(`Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(movies.length / batchSize)}...`);

    // Get embeddings for entire batch in one call
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: batch,
    });

    const rows = batch.map((content, idx) => ({
      content,
      embedding: embeddingResponse.data[idx].embedding,
    }));

    const { error } = await supabase.from('movies').insert(rows);
    if (error) {
      console.error(`Insert error at batch ${i}:`, error.message);
      process.exit(1);
    }
    console.log(`  Inserted ${rows.length} rows.`);
  }

  console.log(`\nDone! Seeded ${movies.length} movies.`);
}

main();
