pipeline {
  agent any

  environment {
    IMAGE_NAME    = "devops-app"
    IMAGE_TAG     = "1"
    KUBECONFIG    = "/tmp/kubeconfig-linux"
    MINIKUBE_HOME = "/var/jenkins_home/.minikube"
  }

  tools {
    nodejs "node18"
  }

  stages {

    stage("Checkout") {
      steps {
        checkout scm
      }
    }

    stage("Install Dependencies") {
      steps {
        sh "npm ci"
      }
    }

    stage("Run Tests") {
      steps {
        sh '''
          set -eux
          echo "--- Backend + Frontend tests ---"
          npm run test:my:coverage
        '''
      }
    }

    stage("Tools Check") {
      steps {
        sh '''
          set -eux
          echo "--- TOOL VERSIONS ---"
          node -v
          npm -v
          kubectl version --client
          minikube version
        '''
      }
    }

    stage("Write kubeconfig") {
      steps {
        sh '''
          set -eux
          cat > /tmp/kubeconfig-linux <<'EOF'
apiVersion: v1
kind: Config
clusters:
- name: minikube
  cluster:
    certificate-authority: /var/jenkins_home/.minikube/ca.crt
    server: https://minikube:8443
contexts:
- name: minikube
  context:
    cluster: minikube
    user: minikube
current-context: minikube
users:
- name: minikube
  user:
    client-certificate: /var/jenkins_home/.minikube/profiles/minikube/client.crt
    client-key: /var/jenkins_home/.minikube/profiles/minikube/client.key
EOF
        '''
      }
    }

    stage("Build Image into Minikube") {
      steps {
        sh '''
          echo "=== GIT INFO ==="
          git rev-parse HEAD
          git log -1 --oneline

          echo "=== WORKSPACE index.html (sha + first lines) ==="
          ls -la public || true
          sha256sum public/index.html || true
          sed -n '1,40p' public/index.html || true

          echo "=== Find ALL index.html in workspace (maxdepth 4) ==="
          find . -maxdepth 4 -name index.html -print -exec sha256sum {} \\; || true

          set -eux

          # Build fresh image in Jenkins docker daemon
          docker build --no-cache -t ${IMAGE_NAME}:${IMAGE_TAG} .

          echo "=== IMAGE index.html (sha + first lines) ==="
          docker run --rm ${IMAGE_NAME}:${IMAGE_TAG} sh -lc 'sha256sum /app/public/index.html; sed -n "1,40p" /app/public/index.html'

          # Try removing old tag in minikube (ignore failures)
          minikube -p minikube image rm ${IMAGE_NAME}:${IMAGE_TAG} || true

          # Load freshly built image into minikube node
          minikube -p minikube image load ${IMAGE_NAME}:${IMAGE_TAG}

          # Confirm tag exists in minikube
          minikube -p minikube image list | grep -E "(^|/)${IMAGE_NAME}:${IMAGE_TAG}" || true
        '''
      }
    }

    stage("Deploy to Minikube") {
      steps {
        sh '''
          set -eux
          export KUBECONFIG=/tmp/kubeconfig-linux

          kubectl apply -f k8s/deployment.yaml
          kubectl apply -f k8s/service.yaml

          kubectl rollout restart deployment/devops-app
          kubectl rollout status deployment/devops-app --timeout=320s

          kubectl get pods -l app=devops-app -o wide

          echo "--- Dumping index.html from NEWEST RUNNING pod (sha + first lines) ---"

          # Pick newest Running pod by creation timestamp (most reliable)
          POD=$(kubectl get pods -l app=devops-app \
            --field-selector=status.phase=Running \
            --sort-by=.metadata.creationTimestamp \
            -o jsonpath='{.items[-1:].metadata.name}')

          echo "Chosen pod: $POD"

          echo "--- Pod image ---"
          kubectl get pod "$POD" -o jsonpath="{.spec.containers[0].image}{\"\\n\"}"

          echo "--- Pod index.html (sha + first lines) ---"
          kubectl exec "$POD" -- sh -lc 'sha256sum /app/public/index.html; sed -n "1,40p" /app/public/index.html'
        '''
      }
    }
  }

  post {
    success {
      echo "CI/CD Pipeline SUCCESSFUL"
      emailext(
        to: 'nathanielchengyx@gmail.com',
        subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        mimeType: 'text/html',
        body: """Build SUCCESS<br/>
Job: ${env.JOB_NAME}<br/>
Build: #${env.BUILD_NUMBER}<br/>
URL: ${env.BUILD_URL}<br/>"""
      )
    }

    failure {
      echo "Pipeline failed — check console logs"
      emailext(
        to: 'nathanielchengyx@gmail.com',
        subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        mimeType: 'text/html',
        body: """Build FAILED<br/>
Job: ${env.JOB_NAME}<br/>
Build: #${env.BUILD_NUMBER}<br/>
URL: ${env.BUILD_URL}<br/>
Check Console Output for errors."""
      )
    }

    always {
      echo "Pipeline finished (success or failure)."
    }
  }
}
