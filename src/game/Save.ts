export class SaveManger {
  private readonly LOCAL_STORAGE_KEY = "drogue_high_scores";

  // High scores
  public getHighScores(): { name: string; score: number; depth: number }[] {
    try {
      const storedScores = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (storedScores) {
        return JSON.parse(storedScores);
      }
    } catch (error) {
      console.error("Error retrieving high scores:", error);
    }

    return [
      { name: "DALE", score: 1000, depth: 9 },
      { name: "GUEST", score: 500, depth: 5 },
      { name: "NOOB", score: 100, depth: 2 },
    ];
  }

  public saveHighScore(name: string, score: number, depth: number): void {
    const highScores = this.getHighScores();
    highScores.push({ name, score, depth });
    highScores.sort((a, b) => b.score - a.score);
    const top5 = highScores.slice(0, 5);
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(top5));
    } catch (error) {
      console.error("Error saving high scores:", error);
    }
  }
}
