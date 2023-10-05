import nltk
from nltk.corpus import cmudict, words, names
from nltk.stem import PorterStemmer

# Initialize CMU Dictionary and Porter Stemmer
nltk.download('cmudict')
nltk.download('words')
nltk.download('names')

pronouncing_dict = cmudict.dict()
stemmer = PorterStemmer()

def get_phonemes(word):
    try:
        return pronouncing_dict[word.lower()][0]
    except KeyError:
        return []

def find_primary_stress_position(phonemes):
    for i, p in enumerate(reversed(phonemes)):
        if '1' in p:
            return len(phonemes) - i - 1
    return -1

def is_rhyme(phonemes1, phonemes2):
    pos1 = find_primary_stress_position(phonemes1)
    pos2 = find_primary_stress_position(phonemes2)
    
    if pos1 == -1 or pos2 == -1:
        return False
    
    if pos1 >= len(phonemes2) or pos2 >= len(phonemes1):
        return False
    
    return phonemes1[pos1:] == phonemes2[pos2:]

def find_rhymes_recursive(word, all_words, depth=5):
    rhymes = set()
    to_explore = {word}
    
    for _ in range(depth):
        new_explore = set()
        for candidate in to_explore:
            target_phonemes = get_phonemes(candidate)
            
            for w in all_words:
                candidate_phonemes = get_phonemes(w)
                if not candidate_phonemes:
                    continue
                
                if is_rhyme(target_phonemes, candidate_phonemes):
                    rhymes.add(w)
                    new_explore.add(w)
        to_explore = new_explore
    
    # Stemming the words to consider all variations
    stemmed_rhymes = {stemmer.stem(word) for word in rhymes}
    
    return list(stemmed_rhymes)

if __name__ == '__main__':
    all_words = set(w.lower() for w in words.words())
    all_words.update([n.lower() for n in names.words()])
    
    word_to_find = 'blind'
    
    rhymes = find_rhymes_recursive(word_to_find, all_words, depth=4)
    
    print(f"Rhymes for {word_to_find}: {rhymes}")
