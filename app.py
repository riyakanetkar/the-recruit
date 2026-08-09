from flask import Flask, render_template

from routes.candidate_routes import candidate_bp
from routes.memory_routes import memory_bp
from routes.aptitude_routes import aptitude_bp
from routes.cipher_routes import cipher_bp
from routes.assessment_routes import assessment_bp

app = Flask(__name__)

app.register_blueprint(candidate_bp)
app.register_blueprint(memory_bp)
app.register_blueprint(aptitude_bp)
app.register_blueprint(cipher_bp)
app.register_blueprint(assessment_bp)


@app.route("/")
def home():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)